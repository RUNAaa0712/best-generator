// CHUNITHM Rating Image Generator - Main Script (v11 - Mobile Save Fix)

(async () => {
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxtftQ0Ng4v5pRWZ5GF-4u5cyo5lgrU_vShr-ImsDt7UZqbOiWX9WN3VPA3l5M0gUyL6g/exec";

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
        statusDiv.innerText = "必要なページ情報を取得中...";
        const [homeHtml, ratingHtml] = await Promise.all([
            fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/home/").then(res => res.text()),
            fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/home/playerData/ratingDetailBest/").then(res => res.text())
        ]);

        const parser = new DOMParser();
        let playerName = "プレイヤー情報なし";
        try {
            const homeDoc = parser.parseFromString(homeHtml, "text/html");
            playerName = homeDoc.querySelector(".player_name_in").innerText.trim();
        } catch (e) {
            console.error("プレイヤー名の取得に失敗:", e);
        }

        const ratingDoc = parser.parseFromString(ratingHtml, "text/html");
        const musicData = Array.from(ratingDoc.querySelectorAll(".box05 > form")).map(form => ({
            title: form.querySelector(".music_title").innerText.trim(),
            score: form.querySelector(".play_musicdata_highscore .text_b").innerText.trim()
        }));

        if (musicData.length === 0) {
            alert("レーティング対象曲のデータが見つかりませんでした。\nログイン状態を確認してください。");
            statusDiv.remove();
            return;
        }

        statusDiv.innerText = "ジャケット画像URLを取得中...";
        const songTitles = musicData.map(d => encodeURIComponent(d.title)).join(",");
        const gasResponse = await fetch(`${GAS_API_URL}?songs=${songTitles}`);
        if (!gasResponse.ok) throw new Error(`GAS APIからの応答エラー: ${gasResponse.status}`);
        const imageUrlMap = await gasResponse.json();

        statusDiv.innerText = "画像を生成中...";

        const container = document.createElement("div");
        container.id = "chunithm-chart-container";
        container.style.position = "absolute";
        container.style.left = "-9999px"; // 画面外に配置
        container.style.top = "0";
        container.style.width = "1240px";
        container.style.backgroundColor = "#1c1c1e";
        container.style.zIndex = "-1";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.alignItems = "center";
        container.style.padding = "20px";
        container.style.boxSizing = "border-box";

        const now = new Date();
        const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        const headerDiv = document.createElement("div");
        headerDiv.style.width = "100%";
        headerDiv.style.display = "flex";
        headerDiv.style.justifyContent = "space-between";
        headerDiv.style.alignItems = "center";
        headerDiv.style.padding = "10px 20px";
        headerDiv.style.marginBottom = "20px";
        headerDiv.style.borderBottom = "2px solid #444";
        headerDiv.style.boxSizing = "border-box";

        const nameElement = document.createElement("h2");
        nameElement.innerText = `Player: ${playerName}`;
        nameElement.style.color = "#eee";
        nameElement.style.margin = "0";
        nameElement.style.fontSize = "20px";

        const timeElement = document.createElement("p");
        timeElement.innerText = `Generated: ${timestamp}`;
        timeElement.style.color = "#aaa";
        timeElement.style.margin = "0";
        timeElement.style.fontSize = "16px";

        headerDiv.appendChild(nameElement);
        headerDiv.appendChild(timeElement);
        container.appendChild(headerDiv);

        const gridDiv = document.createElement("div");
        gridDiv.style.display = "flex";
        gridDiv.style.flexWrap = "wrap";
        gridDiv.style.justifyContent = "center";
        gridDiv.style.width = "100%";

        for (const song of musicData) {
            const imageUrl = imageUrlMap[song.title] || "https://placehold.co/200x200/333/FFF?text=NO%5CnIMAGE";
            const card = document.createElement("div");
            card.style.width = "calc(20% - 20px)";
            card.style.margin = "10px";
            card.style.backgroundColor = "#222";
            card.style.color = "#eee";
            card.style.padding = "10px";
            card.style.borderRadius = "8px";
            card.style.boxShadow = "0 2px 5px rgba(0,0,0,0.5)";
            card.style.textAlign = "center";
            card.style.boxSizing = "border-box";

            const img = document.createElement("img");
            img.src = imageUrl;
            img.style.width = "100%";
            img.style.height = "auto";
            img.style.borderRadius = "4px";
            img.style.marginBottom = "5px";

            const titleP = document.createElement("p");
            titleP.style.fontWeight = "bold";
            titleP.style.fontSize = "14px";
            titleP.style.margin = "0 0 2px 0";
            titleP.style.height = "3em"; // 2行分程度の高さを確保
            titleP.style.lineHeight = "1.5em";
            titleP.style.overflow = "hidden";
            titleP.style.textOverflow = "ellipsis";
            titleP.style.whiteSpace = "normal";
            titleP.innerText = song.title;

            const scoreP = document.createElement("p");
            scoreP.style.margin = "0";
            scoreP.style.fontSize = "12px";
            scoreP.style.color = "#aaa";
            scoreP.innerText = `スコア: ${song.score}`;

            card.appendChild(img);
            card.appendChild(titleP);
            card.appendChild(scoreP);
            gridDiv.appendChild(card);
        }
        container.appendChild(gridDiv);
        document.body.appendChild(container);

        const script = document.createElement("script");
        script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
        script.onload = async () => {
            try {
                const canvas = await html2canvas(container, {
                    backgroundColor: "#1c1c1e",
                    useCORS: true,
                    allowTaint: true,
                    width: 1240,
                    windowWidth: 1240
                });

                // ▼▼▼ 変更点：新しいタブにHTMLを書き込んで画像を表示する方式に変更 ▼▼▼
                canvas.toBlob(blob => {
                    const blobUrl = URL.createObjectURL(blob);
                    const newTab = window.open();

                    if (!newTab) {
                        alert('ポップアップがブロックされました。このサイトのポップアップを許可してください。');
                        statusDiv.innerText = "エラー: ポップアップがブロックされました";
                        return;
                    }

                    const html = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>CHUNITHM Rating Image | ${playerName}</title>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>
                                body { margin: 0; background-color: #111; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; }
                                img { max-width: 100%; height: auto; }
                                p { color: white; font-family: sans-serif; text-align: center; padding: 1em; }
                            </style>
                        </head>
                        <body>
                            <p>画像を長押しして保存、または右クリックして「名前を付けて画像を保存」を選択してください。</p>
                            <img src="${blobUrl}" alt="CHUNITHM Rating Image for ${playerName}">
                        </body>
                        </html>
                    `;
                    newTab.document.open();
                    newTab.document.write(html);
                    newTab.document.close();
                    
                    statusDiv.innerText = "画像を開きました！長押しで保存できます。";
                    // 新しいタブが閉じられたときにメモリを解放する
                    // (必須ではないが、より丁寧な実装)
                    newTab.addEventListener('beforeunload', () => {
                        URL.revokeObjectURL(blobUrl);
                    });

                }, 'image/png');
                // ▲▲▲ 変更点ここまで ▲▲▲

            } catch (e) {
                alert("画像生成中にエラーが発生しました: " + e.message);
                console.error(e);
            } finally {
                container.remove();
            }
        };
        document.body.appendChild(script);

    } catch (e) {
        alert("エラーが発生しました: " + e.message);
        console.error(e);
    } finally {
        setTimeout(() => statusDiv.remove(), 5000); // 表示時間を少し延長
    }
})();
