using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using Versenyrendszer.Models;

namespace Versenyrendszer.Services
{
    public class EmailService
    {
        private readonly string _settingsPath;
        private readonly object _fileLock = new();

        public sealed class EmailSettingsDto
        {
            public string FromEmail { get; set; } = "info@tatamimaster.hu";
            public string FromName { get; set; } = "TatamiMaster Versenyrendszer";
            public string ReplyToEmail { get; set; } = string.Empty;
            public string SmtpHost { get; set; } = "127.0.0.1";
            public int SmtpPort { get; set; } = 25;
            public bool UseSsl { get; set; } = false;
            public string SmtpUsername { get; set; } = string.Empty;
            public string SmtpPassword { get; set; } = string.Empty;
            public string DefaultRejectionReason { get; set; } =
                "Az IKO versenyrendszerben megrendezett versenyekre más szervezethez (pl. Shinkyokushin) tartozó csapatok és egyesületek nem nevezhetnek.";
        }

        public EmailService(IWebHostEnvironment env)
        {
            var appDataDir = Path.Combine(env.ContentRootPath, "App_Data");
            Directory.CreateDirectory(appDataDir);
            _settingsPath = Path.Combine(appDataDir, "email_settings.json");
        }

        public EmailSettingsDto GetSettings(bool maskPassword = false)
        {
            EmailSettingsDto settings;
            lock (_fileLock)
            {
                try
                {
                    if (File.Exists(_settingsPath))
                    {
                        var json = File.ReadAllText(_settingsPath, Encoding.UTF8);
                        settings = JsonSerializer.Deserialize<EmailSettingsDto>(json) ?? new EmailSettingsDto();
                    }
                    else
                    {
                        settings = new EmailSettingsDto();
                    }
                }
                catch
                {
                    settings = new EmailSettingsDto();
                }
            }

            if (string.IsNullOrWhiteSpace(settings.FromEmail)) settings.FromEmail = "info@tatamimaster.hu";
            if (string.IsNullOrWhiteSpace(settings.FromName)) settings.FromName = "TatamiMaster Versenyrendszer";
            if (string.IsNullOrWhiteSpace(settings.SmtpHost)) settings.SmtpHost = "127.0.0.1";
            if (settings.SmtpPort <= 0) settings.SmtpPort = 25;
            if (string.IsNullOrWhiteSpace(settings.DefaultRejectionReason))
            {
                settings.DefaultRejectionReason =
                    "Az IKO versenyrendszerben megrendezett versenyekre más szervezethez (pl. Shinkyokushin) tartozó csapatok és egyesületek nem nevezhetnek.";
            }

            if (maskPassword && !string.IsNullOrEmpty(settings.SmtpPassword))
            {
                settings.SmtpPassword = "********";
            }

            return settings;
        }

        public EmailSettingsDto SaveSettings(EmailSettingsDto incoming)
        {
            var current = GetSettings(maskPassword: false);
            current.FromEmail = string.IsNullOrWhiteSpace(incoming.FromEmail) ? "info@tatamimaster.hu" : incoming.FromEmail.Trim();
            current.FromName = string.IsNullOrWhiteSpace(incoming.FromName) ? "TatamiMaster Versenyrendszer" : incoming.FromName.Trim();
            current.ReplyToEmail = (incoming.ReplyToEmail ?? string.Empty).Trim();
            current.SmtpHost = string.IsNullOrWhiteSpace(incoming.SmtpHost) ? "127.0.0.1" : incoming.SmtpHost.Trim();
            current.SmtpPort = incoming.SmtpPort > 0 ? incoming.SmtpPort : 25;
            current.UseSsl = incoming.UseSsl;
            current.SmtpUsername = (incoming.SmtpUsername ?? string.Empty).Trim();

            if (incoming.SmtpPassword != null && incoming.SmtpPassword != "********")
            {
                current.SmtpPassword = incoming.SmtpPassword;
            }

            if (!string.IsNullOrWhiteSpace(incoming.DefaultRejectionReason))
            {
                current.DefaultRejectionReason = incoming.DefaultRejectionReason.Trim();
            }

            lock (_fileLock)
            {
                var json = JsonSerializer.Serialize(current, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_settingsPath, json, Encoding.UTF8);
            }

            return GetSettings(maskPassword: true);
        }

        public static bool IsLikelyEmail(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return false;
            var t = text.Trim();
            var at = t.IndexOf('@');
            var dot = t.LastIndexOf('.');
            return at > 0 && dot > at + 1 && dot < t.Length - 1 && !t.Contains(' ');
        }

        public static string ResolveRecipientEmail(User user)
        {
            if (IsLikelyEmail(user.Email)) return user.Email.Trim();
            if (IsLikelyEmail(user.Username)) return user.Username.Trim();
            return string.Empty;
        }

        public async Task<(bool Sent, string Message)> SendRegistrationPendingEmailAsync(User user)
        {
            var toEmail = ResolveRecipientEmail(user);
            if (string.IsNullOrEmpty(toEmail))
            {
                return (false, "A felhasználóhoz nem tartozik érvényes e-mail cím.");
            }

            var displayName = string.IsNullOrWhiteSpace(user.FullName) ? user.Username : user.FullName;
            var clubInfo = string.IsNullOrWhiteSpace(user.Club) ? "" : $" ({WebUtility.HtmlEncode(user.Club)})";
            var subject = "TatamiMaster - Köszönjük a regisztrációdat (Elbírálás alatt)";

            var bodyHtml = BuildEmailLayoutHtml(
                badgeText: "REGISZTRÁCIÓ ELBÍRÁLÁS ALATT",
                badgeBg: "#52525B",
                title: "Köszönjük a regisztrációdat!",
                greeting: $"Kedves <strong>{WebUtility.HtmlEncode(displayName)}</strong>{clubInfo}!",
                paragraphs: new[]
                {
                    "Köszönjük a regisztrációdat a <strong>TatamiMaster</strong> hivatalos IKO versenyrendszerben.",
                    "A regisztrációd jelenleg <strong>szervezői / főbírói elbírálás alatt áll</strong> (IKO tagság és egyesületi jogosultság ellenőrzése).",
                    "Amint az elbírálás megtörtént és engedélyeztük a fiókodat, egy újabb automatikus e-mailben értesítünk. A megerősítő e-mail megérkezése után tudsz majd bejelentkezni és nevezni a versenyekre."
                },
                ctaText: "Versenyek megtekintése (Nézői felület)",
                ctaUrl: "https://tatamimaster.hu/views/audience.html"
            );

            return await SendEmailInternalAsync(toEmail, subject, bodyHtml);
        }

        public async Task<(bool Sent, string Message)> SendRegistrationApprovedEmailAsync(User user)
        {
            var toEmail = ResolveRecipientEmail(user);
            if (string.IsNullOrEmpty(toEmail))
            {
                return (false, "A felhasználóhoz nem tartozik érvényes e-mail cím.");
            }

            var displayName = string.IsNullOrWhiteSpace(user.FullName) ? user.Username : user.FullName;
            var clubInfo = string.IsNullOrWhiteSpace(user.Club) ? "" : $" ({WebUtility.HtmlEncode(user.Club)})";
            var subject = "TatamiMaster - Regisztráció folyamata megerősített és engedélyezett";

            var bodyHtml = BuildEmailLayoutHtml(
                badgeText: "REGISZTRÁCIÓ ENGEDÉLYEZVE (IKO)",
                badgeBg: "#18181B",
                title: "A regisztrációd folyamata megerősített és engedélyezett!",
                greeting: $"Kedves <strong>{WebUtility.HtmlEncode(displayName)}</strong>{clubInfo}!",
                paragraphs: new[]
                {
                    "Örömmel értesítünk, hogy a szervezőség <strong>elfogadta és engedélyezte az edzői regisztrációdat</strong> a TatamiMaster rendszerben!",
                    $"Mostantól teljes jogosultsággal bejelentkezhetsz a regisztrált e-mail címeddel (<strong>{WebUtility.HtmlEncode(toEmail)}</strong>), és <strong>nevezhetsz, illetve jelentkezhetsz a meghirdetett IKO versenyre / versenyekre</strong>.",
                    "Az alábbi gombra kattintva azonnal beléphetsz az edzői nevezési felületre:"
                },
                ctaText: "Bejelentkezés és Nevezés Leadása",
                ctaUrl: "https://tatamimaster.hu/?login=1"
            );

            return await SendEmailInternalAsync(toEmail, subject, bodyHtml);
        }

        public async Task<(bool Sent, string Message)> SendRegistrationRejectedEmailAsync(User user, string? customReason = null)
        {
            var toEmail = ResolveRecipientEmail(user);
            if (string.IsNullOrEmpty(toEmail))
            {
                return (false, "A felhasználóhoz nem tartozik érvényes e-mail cím.");
            }

            var settings = GetSettings(maskPassword: false);
            var reason = string.IsNullOrWhiteSpace(customReason)
                ? (string.IsNullOrWhiteSpace(user.RejectionReason) ? settings.DefaultRejectionReason : user.RejectionReason)
                : customReason.Trim();

            var displayName = string.IsNullOrWhiteSpace(user.FullName) ? user.Username : user.FullName;
            var clubInfo = string.IsNullOrWhiteSpace(user.Club) ? "" : $" ({WebUtility.HtmlEncode(user.Club)})";
            var subject = "TatamiMaster - Értesítés regisztráció elbírálásáról";

            var bodyHtml = BuildEmailLayoutHtml(
                badgeText: "REGISZTRÁCIÓ ELUTASÍTVA",
                badgeBg: "#990000",
                title: "Értesítés az edzői regisztráció elbírálásáról",
                greeting: $"Kedves <strong>{WebUtility.HtmlEncode(displayName)}</strong>{clubInfo}!",
                paragraphs: new[]
                {
                    "Köszönjük megkeresésedet és regisztrációs kérelmedet a TatamiMaster versenyrendszerben.",
                    "Sajnálattal értesítünk, hogy a regisztrációdat a szervezőségnek nem áll módjában engedélyezni az alábbi okból:",
                    $"<div style=\"background:#FAF5F5;border-left:4px solid #990000;padding:12px 14px;border-radius:6px;color:#18181B;font-weight:600;\">{WebUtility.HtmlEncode(reason)}</div>",
                    "A nyilvános ágrajzok, mérkőzés-menetrendek és élő eredmények továbbra is szabadon megtekinthetők a nézői felületen. Megértésedet köszönjük!"
                },
                ctaText: "Nyilvános Nézői Felület Megtekintése",
                ctaUrl: "https://tatamimaster.hu/views/audience.html"
            );

            return await SendEmailInternalAsync(toEmail, subject, bodyHtml);
        }

        public async Task<(bool Sent, string Message)> SendTestEmailAsync(string toEmail)
        {
            if (!IsLikelyEmail(toEmail))
            {
                return (false, "Adj meg egy érvényes címzett e-mail címet a teszteléshez!");
            }

            var settings = GetSettings(maskPassword: false);
            var subject = "TatamiMaster - Teszt E-mail (" + settings.FromEmail + ")";
            var bodyHtml = BuildEmailLayoutHtml(
                badgeText: "TESZT E-MAIL SIKERES",
                badgeBg: "#18181B",
                title: "A TatamiMaster automatikus e-mail küldő rendszere működik!",
                greeting: "Kedves Adminisztrátor!",
                paragraphs: new[]
                {
                    $"Ez egy automatikus teszt üzenet a <strong>{WebUtility.HtmlEncode(settings.FromName)} &lt;{WebUtility.HtmlEncode(settings.FromEmail)}&gt;</strong> címről.",
                    "Az edzői regisztrációk beérkezésekor, jóváhagyásakor és elutasításakor a rendszer ugyanezen a csatornán keresztül küldi ki a hivatalos értesítő leveleket."
                },
                ctaText: "Megnyitás: tatamimaster.hu",
                ctaUrl: "https://tatamimaster.hu"
            );

            return await SendEmailInternalAsync(toEmail.Trim(), subject, bodyHtml);
        }

        private static string BuildEmailLayoutHtml(
            string badgeText,
            string badgeBg,
            string title,
            string greeting,
            IEnumerable<string> paragraphs,
            string ctaText,
            string ctaUrl)
        {
            var sb = new StringBuilder();
            sb.Append("<!DOCTYPE html><html lang=\"hu\"><head><meta charset=\"UTF-8\"></head>");
            sb.Append("<body style=\"margin:0;padding:24px;background-color:#F3F0EA;font-family:'Segoe UI',Arial,sans-serif;color:#18181B;\">");
            sb.Append("<div style=\"max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden;box-shadow:0 6px 20px rgba(24,24,27,0.06);\">");

            // Fejléc
            sb.Append("<div style=\"background:#18181B;color:#FAF8F5;padding:20px 26px;border-bottom:3px solid #990000;\">");
            sb.Append("<div style=\"font-size:18px;font-weight:900;letter-spacing:0.6px;\">TATAMI MASTER&#8482; <span style=\"color:#FCA5A5;font-weight:700;font-size:14px;margin-left:6px;\">IKO VERSENYRENDSZER</span></div>");
            sb.Append("</div>");

            // Tartalom
            sb.Append("<div style=\"padding:26px;\">");
            sb.Append($"<div style=\"display:inline-block;background:{badgeBg};color:#FAF8F5;padding:4px 10px;border-radius:5px;font-size:11px;font-weight:800;letter-spacing:0.5px;margin-bottom:14px;\">{WebUtility.HtmlEncode(badgeText)}</div>");
            sb.Append($"<h2 style=\"margin:0 0 16px 0;font-size:20px;color:#18181B;\">{WebUtility.HtmlEncode(title)}</h2>");
            sb.Append($"<p style=\"font-size:15px;line-height:1.55;margin:0 0 14px 0;\">{greeting}</p>");

            foreach (var p in paragraphs)
            {
                sb.Append($"<p style=\"font-size:14.5px;line-height:1.6;color:#27272A;margin:0 0 14px 0;\">{p}</p>");
            }

            if (!string.IsNullOrWhiteSpace(ctaText) && !string.IsNullOrWhiteSpace(ctaUrl))
            {
                sb.Append("<div style=\"margin:24px 0 18px 0;\">");
                sb.Append($"<a href=\"{ctaUrl}\" style=\"display:inline-block;background:#18181B;color:#FAF8F5;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:800;font-size:14px;\">{WebUtility.HtmlEncode(ctaText)}</a>");
                sb.Append("</div>");
            }

            sb.Append("<hr style=\"border:none;border-top:1px solid #E4E0D7;margin:22px 0 14px 0;\">");
            sb.Append("<div style=\"font-size:12.5px;color:#71717A;line-height:1.5;\">");
            sb.Append("Üdvözlettel,<br><strong style=\"color:#18181B;\">TatamiMaster Versenyrendszer Szervezőség</strong><br>");
            sb.Append("<a href=\"https://tatamimaster.hu\" style=\"color:#990000;text-decoration:none;\">https://tatamimaster.hu</a>");
            sb.Append("</div>");
            sb.Append("</div></div></body></html>");
            return sb.ToString();
        }

        private async Task<(bool Sent, string Message)> SendEmailInternalAsync(string toEmail, string subject, string htmlBody)
        {
            var settings = GetSettings(maskPassword: false);
            try
            {
                using var message = new MailMessage();
                message.From = new MailAddress(settings.FromEmail, settings.FromName, Encoding.UTF8);
                message.To.Add(new MailAddress(toEmail));

                if (IsLikelyEmail(settings.ReplyToEmail))
                {
                    message.ReplyToList.Add(new MailAddress(settings.ReplyToEmail.Trim()));
                }

                message.Subject = subject;
                message.SubjectEncoding = Encoding.UTF8;
                message.HeadersEncoding = Encoding.UTF8;
                message.Body = htmlBody;
                message.BodyEncoding = Encoding.UTF8;
                message.IsBodyHtml = true;

                using var client = new SmtpClient(settings.SmtpHost, settings.SmtpPort)
                {
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    EnableSsl = settings.UseSsl,
                    Timeout = 8000
                };

                if (!string.IsNullOrWhiteSpace(settings.SmtpUsername) && !string.IsNullOrEmpty(settings.SmtpPassword))
                {
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(settings.SmtpUsername, settings.SmtpPassword);
                }

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(9));
                await client.SendMailAsync(message, cts.Token);
                Console.WriteLine($"[EMAIL ELKÜLDVE]: {settings.FromEmail} -> {toEmail} ({subject})");
                return (true, $"E-mail sikeresen elküldve a(z) {toEmail} címre ({settings.FromEmail} feladóval).");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL KÜLDÉSI FIGYELMEZTETÉS - {toEmail}]: {ex.Message}");
                return (false, $"Az e-mail küldés nem sikerült ({settings.SmtpHost}:{settings.SmtpPort}): {ex.Message}");
            }
        }
    }
}
