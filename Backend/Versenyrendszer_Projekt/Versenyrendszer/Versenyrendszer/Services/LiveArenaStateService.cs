using System.Collections.Concurrent;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Channels;
using Microsoft.AspNetCore.SignalR;
using Versenyrendszer.Hubs;

namespace Versenyrendszer.Services
{
    public class LiveArenaStateService
    {
        private readonly object _sync = new();
        private readonly string _storageFilePath;
        private readonly IHubContext<LiveArenaHub> _hubContext;

        private long _version = 1;
        private long _dataVersion = 1;
        private string? _latestTatamiKey = null;

        // Kulcs: tatami azonosító (pl. "1", "2", "3" vagy "default")
        private readonly Dictionary<string, JsonObject> _tatamiStates = new(StringComparer.OrdinalIgnoreCase);

        // Megosztott állapotok külön gépek között (kataEredmenyek, kataDontoMeccsIdk, kumiteReszletek, tatamiNevezesLezarva, versenyAdatMap)
        private JsonObject _sharedState = new();

        // Élő Server-Sent Events (SSE) feliratkozók (0 külső CDN függőséggel működő valós idejű csatorna)
        private readonly ConcurrentDictionary<Guid, Channel<string>> _sseClients = new();

        public LiveArenaStateService(IWebHostEnvironment env, IHubContext<LiveArenaHub> hubContext)
        {
            _hubContext = hubContext;
            var appDataDir = Path.Combine(env.ContentRootPath, "App_Data");
            Directory.CreateDirectory(appDataDir);
            _storageFilePath = Path.Combine(appDataDir, "live_arena_state.json");
            LoadPersistedState();
        }

        private void LoadPersistedState()
        {
            try
            {
                if (!File.Exists(_storageFilePath)) return;
                var raw = File.ReadAllText(_storageFilePath);
                if (string.IsNullOrWhiteSpace(raw)) return;

                var parsed = JsonNode.Parse(raw) as JsonObject;
                if (parsed == null) return;

                lock (_sync)
                {
                    if (parsed["shared"] is JsonObject sharedObj)
                    {
                        _sharedState = sharedObj.DeepClone().AsObject();
                    }
                    if (parsed["tatamik"] is JsonObject tatamikObj)
                    {
                        foreach (var kv in tatamikObj)
                        {
                            if (kv.Value is JsonObject tObj)
                            {
                                _tatamiStates[kv.Key] = tObj.DeepClone().AsObject();
                            }
                        }
                    }
                    _latestTatamiKey = parsed["latestTatamiKey"]?.GetValue<string>();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("[LiveArenaState] Állapot betöltési figyelmeztetés: " + ex.Message);
            }
        }

        private void SavePersistedStateLocked()
        {
            try
            {
                var root = new JsonObject
                {
                    ["latestTatamiKey"] = _latestTatamiKey,
                    ["shared"] = _sharedState.DeepClone()
                };

                var tatamikObj = new JsonObject();
                foreach (var kv in _tatamiStates)
                {
                    tatamikObj[kv.Key] = kv.Value.DeepClone();
                }
                root["tatamik"] = tatamikObj;

                var tmpPath = _storageFilePath + ".tmp";
                File.WriteAllText(tmpPath, root.ToJsonString(new JsonSerializerOptions { WriteIndented = false }));
                File.Move(tmpPath, _storageFilePath, overwrite: true);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[LiveArenaState] Állapot mentési figyelmeztetés: " + ex.Message);
            }
        }

        public long CurrentVersion
        {
            get { lock (_sync) return _version; }
        }

        public JsonObject GetSnapshot(long sinceVersion = 0)
        {
            lock (_sync)
            {
                if (sinceVersion > 0 && sinceVersion >= _version)
                {
                    return new JsonObject
                    {
                        ["changed"] = false,
                        ["version"] = _version,
                        ["dataVersion"] = _dataVersion,
                        ["serverTimeMs"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                    };
                }

                var tatamikCopy = new JsonObject();
                foreach (var kv in _tatamiStates)
                {
                    tatamikCopy[kv.Key] = kv.Value.DeepClone();
                }

                JsonNode? latestNode = null;
                if (!string.IsNullOrEmpty(_latestTatamiKey) && _tatamiStates.TryGetValue(_latestTatamiKey, out var latestObj))
                {
                    latestNode = latestObj.DeepClone();
                }
                else if (_tatamiStates.Count > 0)
                {
                    latestNode = _tatamiStates.Values.Last().DeepClone();
                }

                return new JsonObject
                {
                    ["changed"] = true,
                    ["version"] = _version,
                    ["dataVersion"] = _dataVersion,
                    ["serverTimeMs"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    ["latestTatamiKey"] = _latestTatamiKey,
                    ["latestTatami"] = latestNode,
                    ["tatamik"] = tatamikCopy,
                    ["shared"] = _sharedState.DeepClone()
                };
            }
        }

        public JsonObject UpdateTatamiState(string tatamiKey, JsonObject statePayload)
        {
            string key = string.IsNullOrWhiteSpace(tatamiKey) ? "default" : tatamiKey.Trim();
            JsonObject storedCopy;
            long ver;

            lock (_sync)
            {
                var cloned = statePayload.DeepClone().AsObject();
                cloned["tatamiKey"] = key;
                cloned["updatedAtMs"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                _tatamiStates[key] = cloned;
                _latestTatamiKey = key;
                _version++;
                ver = _version;
                storedCopy = cloned.DeepClone().AsObject();
            }

            var evt = new JsonObject
            {
                ["type"] = "tatami_updated",
                ["version"] = ver,
                ["tatamiKey"] = key,
                ["tatami"] = storedCopy
            };

            BroadcastEvent("tatami_updated", evt);
            return storedCopy;
        }

        public JsonObject UpdateSharedState(string key, JsonNode? value, bool mergeObject = true)
        {
            if (string.IsNullOrWhiteSpace(key)) return new JsonObject();
            JsonNode? updatedValueCopy;
            long ver;

            lock (_sync)
            {
                if (mergeObject && value is JsonObject incomingObj && _sharedState[key] is JsonObject existingObj)
                {
                    foreach (var prop in incomingObj)
                    {
                        existingObj[prop.Key] = prop.Value?.DeepClone();
                    }
                }
                else
                {
                    _sharedState[key] = value?.DeepClone();
                }

                _version++;
                ver = _version;
                updatedValueCopy = _sharedState[key]?.DeepClone();
                SavePersistedStateLocked();
            }

            var evt = new JsonObject
            {
                ["type"] = "shared_updated",
                ["version"] = ver,
                ["key"] = key,
                ["value"] = updatedValueCopy
            };

            BroadcastEvent("shared_updated", evt);
            return evt;
        }

        public void NotifyDatabaseChanged(string sourcePath)
        {
            long ver;
            long dVer;
            lock (_sync)
            {
                _version++;
                _dataVersion++;
                ver = _version;
                dVer = _dataVersion;
            }

            var evt = new JsonObject
            {
                ["type"] = "data_changed",
                ["version"] = ver,
                ["dataVersion"] = dVer,
                ["source"] = sourcePath,
                ["serverTimeMs"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            BroadcastEvent("data_changed", evt);
        }

        public void ResetAll()
        {
            long ver;
            long dVer;
            lock (_sync)
            {
                _tatamiStates.Clear();
                _sharedState = new JsonObject();
                _latestTatamiKey = null;
                _version++;
                _dataVersion++;
                ver = _version;
                dVer = _dataVersion;
                SavePersistedStateLocked();
            }

            var evt = new JsonObject
            {
                ["type"] = "reset_all",
                ["version"] = ver,
                ["dataVersion"] = dVer
            };

            BroadcastEvent("reset_all", evt);
        }

        public (Guid ClientId, ChannelReader<string> Reader) SubscribeSse()
        {
            var id = Guid.NewGuid();
            var channel = Channel.CreateBounded<string>(new BoundedChannelOptions(32)
            {
                FullMode = BoundedChannelFullMode.DropOldest,
                SingleReader = true,
                SingleWriter = false
            });
            _sseClients[id] = channel;
            return (id, channel.Reader);
        }

        public void UnsubscribeSse(Guid clientId)
        {
            if (_sseClients.TryRemove(clientId, out var channel))
            {
                channel.Writer.TryComplete();
            }
        }

        private void BroadcastEvent(string eventName, JsonObject payload)
        {
            string json = payload.ToJsonString();

            foreach (var kv in _sseClients)
            {
                kv.Value.Writer.TryWrite($"event: {eventName}\ndata: {json}\n\n");
            }

            _ = Task.Run(async () =>
            {
                try
                {
                    await _hubContext.Clients.All.SendAsync(eventName, json);
                }
                catch
                {
                    // SignalR kliens lecsatlakozás esetén nincs teendő
                }
            });
        }

        public static List<string> GetLocalLanIpv4Addresses()
        {
            var results = new List<string>();
            try
            {
                foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
                {
                    if (ni.OperationalStatus != OperationalStatus.Up) continue;
                    if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback ||
                        ni.NetworkInterfaceType == NetworkInterfaceType.Tunnel) continue;

                    var desc = (ni.Description + " " + ni.Name).ToLowerInvariant();
                    if (desc.Contains("virtual") || desc.Contains("vmware") || desc.Contains("vbox") || desc.Contains("wsl") || desc.Contains("hyper-v"))
                    {
                        continue;
                    }

                    var ipProps = ni.GetIPProperties();
                    foreach (var ua in ipProps.UnicastAddresses)
                    {
                        if (ua.Address.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(ua.Address))
                        {
                            var ipStr = ua.Address.ToString();
                            if (!ipStr.StartsWith("169.254.") && !results.Contains(ipStr))
                            {
                                results.Add(ipStr);
                            }
                        }
                    }
                }
            }
            catch
            {
            }
            return results;
        }
    }
}
