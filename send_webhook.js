const fs = require("fs");
const path = require("path");

const WEBHOOK_URL = "https://discord.com/api/webhooks/1484628815463317536/NfRflWVgBqNxKpK8UUVcLSAVhnUPUndbRqRmndMLbjh5xpLUgU6uqEeMwk0ryVb6dYtd";

async function sendWebhook() {
  const bannerPath = path.join(__dirname, "coco_games_banner.png");
  const bannerFile = fs.readFileSync(bannerPath);

  const payload = {
    embeds: [
      {
        title: "\u2615 Welcome to COCO GAMES",
        description:
          "COCO GAMES is a community-driven game studio building fun, immersive experiences on **Roblox** and beyond.\n\n\ud83c\udf10 Our website is your hub for everything COCO GAMES \u2014 connect your accounts, track your progress, join events, and earn exclusive rewards.",
        color: 0xe8944a,
        image: { url: "attachment://coco_games_banner.png" },
        fields: [
          {
            name: "\ud83d\udee1\ufe0f  How to Get Verified",
            value:
              "Getting verified is simple and takes under a minute:\n\n\ud83d\udd39 **Step 1** \u2014 Click the link below to visit our site\n\ud83d\udd39 **Step 2** \u2014 Sign in with your **Discord** account\n\ud83d\udd39 **Step 3** \u2014 Link your **Roblox** account\n\u2705 **Step 4** \u2014 You'll receive the **Verified** role automatically!\n\n> Both your Discord **and** Roblox accounts must be connected to get verified.",
            inline: false,
          },
          {
            name: "\ud83c\udfae  Why Connect",
            value:
              "\u2b50 Get the **Verified** role in this server\n\ud83d\udd13 Access exclusive channels and perks\n\ud83d\udd17 Link your Roblox identity to your Discord\n\ud83d\udcca Track your stats and progress across our games\n\ud83d\udce3 Be first to know about new releases and events",
            inline: false,
          },
          {
            name: "\ud83d\ude80  Get Started",
            value:
              "\u27a1\ufe0f **[Click here to connect your account](https://coco-games-ieew.vercel.app)**",
            inline: false,
          },
        ],
        footer: { text: "COCO GAMES \u2022 Verification System" },
      },
    ],
  };

  const boundary = "----WebhookBoundary" + Date.now();
  const parts = [];

  // JSON payload part
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="payload_json"\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(payload)}\r\n`
  );

  // File part
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

sendWebhook();
