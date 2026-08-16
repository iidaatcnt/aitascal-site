import { EmailMessage } from "cloudflare:email";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle Contact Form submissions
    if (request.method === "POST" && url.pathname === "/api/contact") {
      try {
        const data = await request.json();
        
        const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
        const subject = data._subject || "【AI TasCal】Webサイトよりお問い合わせがありました";
        
        const bodyLines = [
          "【AI TasCal Webサイトよりお問い合わせがありました】",
          "--------------------------------------------------",
          `■ 送信日時: ${now}`,
          `■ 種別: ${data.種別 || "お問い合わせ"}`,
          `■ 会社名: ${data.会社名 || "（未記入）"}`,
          `■ お名前: ${data.お名前 || "（未記入）"}`,
          `■ メールアドレス: ${data.メールアドレス || "（未記入）"}`,
          `■ 電話番号: ${data.電話番号 || "（未記入）"}`,
          `■ 認知経路/プラン: ${data.認知経路 || data.検討中のプラン || "（未記入）"}`,
          "--------------------------------------------------",
          "■ ご相談内容 / お問い合わせ詳細:",
          data.お問い合わせ内容 || data.ご相談内容 || "（なし）",
          "--------------------------------------------------"
        ];
        const bodyContent = bodyLines.join("\n");

        // Encode subject and body into UTF-8 Base64 MIME message
        const encodeBase64 = (str) => {
          const bytes = new TextEncoder().encode(str);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return btoa(binary);
        };

        const encodedSubject = `=?UTF-8?B?${encodeBase64(subject)}?=`;
        const encodedBody = encodeBase64(bodyContent);

        const rawEmail = [
          'From: "AI TasCal" <info@aitascal.net>',
          'To: miidacnt@gmail.com',
          `Subject: ${encodedSubject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/plain; charset=UTF-8',
          'Content-Transfer-Encoding: base64',
          '',
          encodedBody
        ].join('\r\n');

        const message = new EmailMessage(
          "info@aitascal.net",
          "miidacnt@gmail.com",
          rawEmail
        );

        await env.EMAIL.send(message);

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        console.error("Failed to send email:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Pass through to static assets
    return env.ASSETS.fetch(request);
  }
};
