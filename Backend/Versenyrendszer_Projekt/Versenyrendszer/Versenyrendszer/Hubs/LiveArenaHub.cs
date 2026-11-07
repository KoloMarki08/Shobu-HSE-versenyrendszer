using Microsoft.AspNetCore.SignalR;

namespace Versenyrendszer.Hubs
{
    public class LiveArenaHub : Hub
    {
        public async Task JoinTournamentGroup(string versenyId)
        {
            if (!string.IsNullOrWhiteSpace(versenyId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"verseny_{versenyId}");
            }
        }
    }
}
