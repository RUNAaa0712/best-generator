javascript:(async () => {
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwfLTp-tyP4V2gXgqgGlvtoFiELY9BrnxP1QURAUx7_3xujoSbp5bUh_7nze5OELN2scg/exec";

    const statusDiv = document.createElement("div");
    statusDiv.style.position = "fixed";
    statusDiv.style.top = "10px";
    statusDiv.style.left = "10px";
    statusDiv.style.padding = "10px";
    statusDiv.style.backgroundColor = "rgba(0,0,0,0.8)";
    statusDiv.style.color = "white";
    statusDiv.style.zIndex = "9999";
    statusDiv.style.borderRadius = "5px";
    statusDiv.innerText = "データを取得しています...";
    document.body.appendChild(statusDiv);

    try {
        statusDiv.innerText = "CHUNITHM-NETから情報を取得中...";
        const [homeHtml, ratingHtml] = await Promise.all([
            fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/home/").then(res => res.text()),
            fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/home/playerData/ratingDetailBest/").then(res => res.text())
        ]);

        const parser = new DOMParser();
        let playerName = "プレイヤー情報なし";
        try {
            playerName = parser.parseFromString(homeHtml, "text/html").querySelector(".player_name_in").innerText.trim();
        } catch (e) { console.error("プレイヤー名の取得に失敗:", e); }

        const musicData = Array.from(parser.parseFromString(ratingHtml, "text/html").querySelectorAll(".box05 > form")).map(form => ({
            title: form.querySelector(".music_title").innerText.trim(),
            score: form.querySelector(".play_musicdata_highscore .text_b").innerText.trim().replace(/,/g, '')
        }));

        if (musicData.length === 0) {
            alert("レーティング対象曲が見つかりません。\nログイン状態を確認してください。");
            statusDiv.remove();
            return;
        }

        statusDiv.innerText = "サーバー側で画像を生成中です...\n(最大60秒ほどかかります)";
        
        const payload = { playerName, musicData };

        const gasResponse = await fetch(GAS_API_URL, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        if (!gasResponse.ok) throw new Error(`APIエラー: ${gasResponse.status}`);
        
        const result = await gasResponse.json();

        if (!result.success) throw new Error(`画像生成エラー: ${result.message}`);
        
        statusDiv.innerText = "画像を表示します！";
        
        const imageWindow = window.open("", "_blank");
        imageWindow.document.write(`<html><head><title>${playerName} Rating Best Image</title><style>body{margin:0;background:#2a2a2a;display:flex;justify-content:center;align-items:center;min-height:100vh;}img{max-width:100%;height:auto;box-shadow: 0 0 20px rgba(0,0,0,0.5);}</style></head><body><img src="${result.imageData}" alt="生成されたレーティング対象曲の画像"></body></html>`);
        imageWindow.document.close();

    } catch (e) {
        alert("エラーが発生しました: " + e.message);
        console.error(e);
        statusDiv.innerText = "エラーが発生しました。";
    } finally {
        setTimeout(() => statusDiv.remove(), 5000);
    }
})();
