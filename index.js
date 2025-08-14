const backendUrl = "https://nfl-website.onrender.com";
const baseUrl = window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:3000"
    : "https://nfl-website.onrender.com";

async function callAI(messages) {
    const response = await fetch(`${backendUrl}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
}

document.addEventListener("DOMContentLoaded", () => {
    const tradeButton = document.getElementById("tradeButton");
    const aiResultDiv = document.getElementById("aiResult"); // ✅ Add this to HTML

    if (!tradeButton) return;

    tradeButton.addEventListener("click", async () => {
        try {
            const trade1Players = [...document.querySelectorAll("#tradeBox1 .roster-item")]
                .map(el => el.querySelector("strong")?.textContent || "Unknown");
            const trade2Players = [...document.querySelectorAll("#tradeBox2 .roster-item")]
                .map(el => el.querySelector("strong")?.textContent || "Unknown");

            const tradePrompt = `
                You are an NFL trade evaluation expert.
                Evaluate the following trade and return ONLY a JSON object with this structure:
                {
                    "team1_agree_percent": number, 
                    "team2_agree_percent": number, 
                    "analysis": string
                }
                Percentages should be from 0 to 100 indicating the likelihood each team would agree.
                "analysis" should briefly explain why each team likely would or wouldn’t agree.

                Trade Proposal:
                Team 1 gives: ${trade1Players.join(", ") || "No players"}.
                Team 2 gives: ${trade2Players.join(", ") || "No players"}.
            `;

            const aiResponse = await callAI([{ role: "user", content: tradePrompt }]);
            console.log("Raw AI Response:", aiResponse);

            let parsed;
            try {
                parsed = JSON.parse(aiResponse);
            } catch (err) {
                throw new Error("AI response was not valid JSON. Response: " + aiResponse);
            }

            // Display results on the page
            aiResultDiv.innerHTML = `
                <h3>Trade Analysis</h3>
                <p><strong>Team 1 Agreement Chance:</strong> ${parsed.team1_agree_percent}%</p>
                <p><strong>Team 2 Agreement Chance:</strong> ${parsed.team2_agree_percent}%</p>
                <p><strong>Analysis:</strong> ${parsed.analysis}</p>
            `;
        } catch (err) {
            console.error("Trade AI Error:", err);
            aiResultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
        }
    });
});

  
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    const el = ev.target.closest('.roster-item');
    if (!el) return;
    if (!el.dataset.playerId) {
        el.dataset.playerId = 'p-' + Math.random().toString(36).slice(2, 9);
    }
    ev.dataTransfer.setData('playerId', el.dataset.playerId);
    const teamPanelId = el.closest('.team-panel').id;
    const teamNumber = teamPanelId.replace('teamPanel', '');
    ev.dataTransfer.setData('teamNumber', teamNumber);
}

function drop(ev, boxNumber) {
    ev.preventDefault();
    const playerId = ev.dataTransfer.getData('playerId');
    const fromTeamNumber = ev.dataTransfer.getData('teamNumber');
    if (String(fromTeamNumber) !== String(boxNumber)) {
        window.alert(`You can only add players from Team ${boxNumber} to Trade Box ${boxNumber}`);
        return;
    }
    const playerEl = document.querySelector(`[data-player-id="${playerId}"]`);
    if (!playerEl) return;
    playerEl.dataset.originalContainer = playerEl.closest('.roster-list').parentElement.id;
    playerEl.removeAttribute('draggable');
    playerEl.removeAttribute('ondragstart');
    addDeleteButton(playerEl, boxNumber);
    document.querySelector(`#tradeBox${boxNumber} .trade-players`).appendChild(playerEl);
    document.getElementById(`teamDropdown${boxNumber}`).disabled = true;
}

function addDeleteButton(playerEl, boxNumber) {
    if (playerEl.querySelector('.delete-btn')) return;

    const deleteImg = document.createElement('img');
    deleteImg.src = 'red-trash-can-icon.png';
    deleteImg.alt = 'Remove player';
    deleteImg.className = 'delete-btn';
    deleteImg.title = 'Remove player';
    deleteImg.style.width = '20px';
    deleteImg.style.height = '20px';
    deleteImg.style.cursor = 'pointer';

    deleteImg.addEventListener('click', () => {
        const originalResultsDiv = document.getElementById(playerEl.dataset.originalContainer);
        if (originalResultsDiv) {
            const rosterList = originalResultsDiv.querySelector('.roster-list');
            if (rosterList) {
                playerEl.setAttribute('draggable', 'true');
                playerEl.setAttribute('ondragstart', 'drag(event)');
                playerEl.removeChild(deleteImg);
                rosterList.appendChild(playerEl);
                const tradeBox = document.querySelector(`#tradeBox${boxNumber} .trade-players`);
                if (tradeBox.children.length === 0) {
                    document.getElementById(`teamDropdown${boxNumber}`).disabled = false;
                }
            }
        }
    });

    playerEl.appendChild(deleteImg);
}

async function redeployServer() {
    if (window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1")) {
      console.log("Skipping redeploy on localhost.");
      return;
    }
    try {
        const response = await fetch(`${baseUrl}/redeploy`, { method: "POST" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        console.log("Server redeploy triggered successfully.");
    } catch (error) {
        console.error("Error redeploying server:", error.message);
    }
}

window.onload = redeployServer;

function onTeamSelect(teamNumber) {
    const selectedTeam = document.getElementById(`teamDropdown${teamNumber}`).value;
    if (selectedTeam) fetchTeamRoster(selectedTeam, teamNumber);
}

async function fetchTeamRoster(teamName, teamNumber) {
    const apiUrl = `https://nfl-website.onrender.com/proxy?team=${encodeURIComponent(teamName)}`;
    const resultsDiv = document.getElementById(`results${teamNumber}`);
    const defaultHeadshot = "default-headshot.png";
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Roster not found or API error');
        const data = await response.json();

        const rosterHtml = data.teams[0].roster.map((player, idx) => {
            const headshotUrl = player.headshot?.includes('{format}')
                ? player.headshot.replace('{format}', 'f_auto,q_auto')
                : defaultHeadshot;
            const name = player.name || "N/A";
            const position = player.position || "N/A";
            const age = player.age ?? "N/A";
            return `
                <div class="roster-item" data-player-id="${teamNumber}-${idx}" draggable="true" ondragstart="drag(event)">
                    <img src="${headshotUrl}" alt="${name}">
                    <div>
                        <p><strong>${name}</strong> (${position})</p>
                        <p>Age: ${age}</p>
                    </div>
                </div>
            `;
        }).join('');

        resultsDiv.innerHTML = `
            <h2>${teamName} Roster</h2>
            <div class="roster-list">${rosterHtml}</div>
        `;
    } catch (error) {
        resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}
