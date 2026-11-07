using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Mvc;
using Versenyrendszer.Services;

namespace Versenyrendszer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LiveArenaController : ControllerBase
    {
        private readonly LiveArenaStateService _liveState;

        public LiveArenaController(LiveArenaStateService liveState)
        {
            _liveState = liveState;
        }

        // GET: api/LiveArena/snapshot?sinceVersion=0
        [HttpGet("snapshot")]
        public IActionResult GetSnapshot([FromQuery] long sinceVersion = 0)
        {
            var snap = _liveState.GetSnapshot(sinceVersion);
            return Content(snap.ToJsonString(), "application/json; charset=utf-8");
        }

        // GET: api/LiveArena/network-info
        [HttpGet("network-info")]
        public IActionResult GetNetworkInfo()
        {
            var ips = LiveArenaStateService.GetLocalLanIpv4Addresses();
            return Ok(new
            {
                lanIps = ips,
                httpPort = 5008,
                httpsPort = 7045
            });
        }

        // POST: api/LiveArena/tatami
        [HttpPost("tatami")]
        public IActionResult UpdateTatami([FromBody] JsonObject payload)
        {
            if (payload == null) return BadRequest();
            string tatamiKey = payload["tatamiId"]?.ToString()
                               ?? payload["tatamiKey"]?.ToString()
                               ?? "default";
            var updated = _liveState.UpdateTatamiState(tatamiKey, payload);
            return Content(updated.ToJsonString(), "application/json; charset=utf-8");
        }

        // POST: api/LiveArena/shared
        [HttpPost("shared")]
        public IActionResult UpdateShared([FromBody] JsonObject payload)
        {
            if (payload == null) return BadRequest();
            string? key = payload["key"]?.GetValue<string>();
            if (string.IsNullOrWhiteSpace(key)) return BadRequest(new { error = "Hiányzó kulcs (key)." });

            bool merge = payload["merge"]?.GetValue<bool>() ?? true;
            JsonNode? val = payload["value"];
            var res = _liveState.UpdateSharedState(key, val, merge);
            return Content(res.ToJsonString(), "application/json; charset=utf-8");
        }

        // POST: api/LiveArena/notify
        [HttpPost("notify")]
        public IActionResult NotifyChange([FromBody] JsonObject? payload)
        {
            string source = payload?["source"]?.ToString() ?? "manual";
            _liveState.NotifyDatabaseChanged(source);
            return Ok(new { ok = true, version = _liveState.CurrentVersion });
        }

        // GET: api/LiveArena/stream (Valós idejű Server-Sent Events csatorna)
        [HttpGet("stream")]
        public async Task StreamEvents(CancellationToken cancellationToken)
        {
            Response.Headers["Content-Type"] = "text/event-stream; charset=utf-8";
            Response.Headers["Cache-Control"] = "no-cache, no-transform";
            Response.Headers["Connection"] = "keep-alive";
            Response.Headers["X-Accel-Buffering"] = "no";

            await Response.Body.FlushAsync(cancellationToken);

            var (clientId, reader) = _liveState.SubscribeSse();
            try
            {
                // Azonnali kezdő pillanatkép küldése csatlakozáskor
                var initialSnap = _liveState.GetSnapshot(0).ToJsonString();
                await Response.WriteAsync($"event: snapshot\ndata: {initialSnap}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);

                while (!cancellationToken.IsCancellationRequested)
                {
                    using var keepAliveCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                    keepAliveCts.CancelAfter(TimeSpan.FromSeconds(15));

                    try
                    {
                        var msg = await reader.ReadAsync(keepAliveCts.Token);
                        await Response.WriteAsync(msg, cancellationToken);
                        await Response.Body.FlushAsync(cancellationToken);
                    }
                    catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
                    {
                        // 15 mp-es szívverés (keep-alive), hogy a Wi-Fi router / böngésző ne bontsa le a kapcsolatot
                        await Response.WriteAsync(": keepalive\n\n", cancellationToken);
                        await Response.Body.FlushAsync(cancellationToken);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Normál kliens lecsatlakozás (pl. lap bezárása)
            }
            finally
            {
                _liveState.UnsubscribeSse(clientId);
            }
        }
    }
}
