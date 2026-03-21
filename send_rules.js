const fs = require("fs");
const path = require("path");

const WEBHOOK_URL = "https://discord.com/api/webhooks/1484967146537877767/M_OWNU3j-Tl3ROtupT0thsQ7oe3WBL8Sh3KEgV-LaPgHuvOFPgKsUWhnhbpgTZF21zPN";

async function sendRules() {
  const bannerPath = path.join(__dirname, "coco_games_banner.png");
  const bannerFile = fs.readFileSync(bannerPath);

  const payload = {
    embeds: [
      {
        title: "\ud83d\udcdc Server Rules",
        description: "Welcome to the official **COCO GAMES** Discord! To keep this community fun and safe for everyone, please follow these rules at all times. Breaking them may result in warnings, mutes, or bans.",
        color: 0xe8944a,
        image: { url: "attachment://coco_games_banner.png" },
        fields: [
          {
            name: "\ud83d\udd39 Rule 1 \u2014 Be Respectful",
            value: "Treat everyone with kindness. No harassment, bullying, hate speech, discrimination, or personal attacks of any kind. We're all here to have fun.",
            inline: false,
          },
          {
            name: "\ud83d\udd39 Rule 2 \u2014 No Spam or Flooding",
            value: "Don't spam messages, emojis, images, links, or mentions. Keep conversations meaningful and avoid excessive caps or repeated messages.",
            inline: false,
          },
          {
            name: "\ud83d\udd39 Rule 3 \u2014 Keep It SFW",
            value: "No NSFW content, gore, or disturbing material anywhere in the server. This includes profile pictures, usernames, statuses, and shared media.",
            inline: false,
          },
          {
            name: "\ud83d\udd39 Rule 4 \u2014 No Self-Promotion or Advertising",
            value: "Don't advertise other servers, social media, games, or services without explicit permission from staff. This includes DM advertising to members.",
            inline: false,
          },
          {
            name: "\ud83d\udd39 Rule 5 \u2014 Use Channels Correctly",
            value: "Post content in the appropriate channels. Off-topic conversations, bot commands, and media each have their designated places.",
            inline: false,
          },
          {
            name: "\ud83d\udd39 Rule 6 \u2014 No Exploiting or Cheating",
            value: "Don't share, promote, or discuss exploits, hacks, or cheats for any COCO GAMES titles or Roblox in general. Report bugs through the ticket system instead.",
            inline: false,
          },
          {
            name: "\ud83d\udd39 Rule 7 \u2014 No Impersonation",
            value: "Don't impersonate staff members, other users, or any public figures. This includes using similar names, avatars, or pretending to have roles you don't.",
            inline: false,
          },
          {
            name: "\ud83d\udd39 Rule 8 \u2014 Listen to Staff",
            value: "Moderators and admins have the final say. If a staff member asks you to stop doing something, listen. If you disagree with a decision, open a ticket on our site.",
            inline: false,
          },
          {
            name: "\ud83d\udd39 Rule 9 \u2014 No Leaking or Sharing Private Info",
            value: "Don't share personal information about yourself or others (doxxing). Don't leak unreleased content, private conversations, or confidential studio info.",
            inline: false,
          },
          {
            name: "\ud83d\udd39 Rule 10 \u2014 Use Common Sense",
            value: "If something feels wrong, it probably is. Staff reserves the right to take action on behavior not explicitly listed here if it disrupts the community.",
            inline: false,
          },
          {
            name: "\u26a0\ufe0f  Consequences",
            value: "**1st Offense** \u2014 Verbal warning\n**2nd Offense** \u2014 Mute (duration varies)\n**3rd Offense** \u2014 Kick or temporary ban\n**Severe Violations** \u2014 Immediate permanent ban\n\n> Punishments may vary based on severity. Appeals can be submitted at **[our website](https://coco-games-ieew.vercel.app)**.",
            inline: false,
          },
          {
            name: "\u2705  By staying in this server, you agree to follow these rules.",
            value: "Have questions? Open a ticket on our site or reach out to any staff member. Enjoy your stay! \u2615",
            inline: false,
          },
        ],
        footer: { text: "COCO GAMES \u2022 Community Guidelines" },
      },
    ],
  };

  const boundary = "----WebhookBoundary" + Date.now();
  const parts = [];

  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="payload_json"\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(payload)}\r\n`
  );

  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="files[0]"; filename="coco_games_banner.png"\r\nContent-Type: image/png\r\n\r\n`
  );

  const body = Buffer.concat([
    Buffer.from(parts[0], "utf-8"),
    Buffer.from(parts[1], "utf-8"),
    bannerFile,
    Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8"),
  ]);

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body,
  });

  const text = await res.text();
  console.log(res.status, res.ok ? "OK" : text);
}

sendRules();
