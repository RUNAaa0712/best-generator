// CHUNITHM Rating Image Generator - Main Script (v9 - Final HTML Modal)

(async () => {
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxtftQ0Ng4v5pRWZ5GF-4u5cyo5lgrU_vShr-ImsDt7UZqbOiWX9WN3VPA3l5M0gUyL6g/exec";

    const statusDiv = document.createElement("div");
    statusDiv.style.position = "fixed";
    statusDiv.style.top = "10px";
    statusDiv.style.left = "10px";
    statusDiv.style.padding = "10px";
    statusDiv.style.backgroundColor = "black";
    statusDiv.style.color = "white";
    statusDiv.style.zIndex = "9999";
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

        statusDiv.innerText = "モーダルを生成中...";

        // ▼▼▼ ここからが新しいモーダル表示の処理 ▼▼▼
        
        // --- 1. モーダルの骨格を作成 ---
        const modalOverlay = document.createElement("div");
        modalOverlay.style.position = "fixed";
        modalOverlay.style.top = "0";
        modalOverlay.style.left = "0";
        modalOverlay.style.width = "100%";
        modalOverlay.style.height = "100%";
        modalOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
        modalOverlay.style.zIndex = "100000";
        modalOverlay.style.display = "flex";
        modalOverlay.style.justifyContent = "center";
        modalOverlay.style.alignItems = "center";
        document.body.style.overflow = "hidden";

        const modalContainer = document.createElement("div");
        modalContainer.style.backgroundColor = "#1c1c1e";
        modalContainer.style.width = "95%";
        modalContainer.style.height = "95%";
        modalContainer.style.maxWidth = "1280px";
        modalContainer.style.borderRadius = "8px";
        modalContainer.style.display = "flex";
        modalContainer.style.flexDirection = "column";

        const modalHeader = document.createElement("div");
        modalHeader.style.padding = "15px";
        modalHeader.style.display = "flex";
        modalHeader.style.justifyContent = "space-between";
        modalHeader.style.alignItems = "center";
        modalHeader.style.borderBottom = "1px solid #444";
        
        const modalBody = document.createElement("div");
        modalBody.id = "chunithm-chart-container-for-canvas"; // html2canvasが対象とするID
        modalBody.style.overflowY = "auto";
        modalBody.style.flexGrow = "1";
        modalBody.style.padding = "20px";
        modalBody.style.display = "flex";
        modalBody.style.flexDirection = "column";
        modalBody.style.alignItems = "center";
        
        modalContainer.appendChild(modalHeader);
        modalContainer.appendChild(modalBody);
        modalOverlay.appendChild(modalContainer);

        // --- 2. モーダルヘッダーの中身を作成 ---
        const downloadButton = document.createElement("button");
        downloadButton.innerText = "ダウンロード";
        downloadButton.style.padding = "8px 16px";
        downloadButton.style.backgroundColor = "#9c27b0";
        downloadButton.style.color = "white";
        downloadButton.style.border = "none";
        downloadButton.style.borderRadius = "5px";
        downloadButton.style.fontWeight = "bold";
        downloadButton.style.cursor = "pointer";

        const closeButton = document.createElement("button");
        closeButton.innerText = "×";
        closeButton.style.fontSize = "24px";
        closeButton.style.backgroundColor = "transparent";
        closeButton.style.color = "#ccc";
        closeButton.style.border = "none";
        closeButton.style.cursor = "pointer";

        modalHeader.appendChild(downloadButton);
        modalHeader.appendChild(closeButton);

        // --- 3. モーダルボディの中身（画像化するコンテンツ）を作成 ---
        const now = new Date();
        const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        
        const headerDiv = document.createElement("div");
        headerDiv.style.width = "100%";
        headerDiv.style.maxWidth = "1200px";
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
        modalBody.appendChild(headerDiv);

        const gridDiv = document.createElement("div");
        gridDiv.style.display = "flex";
        gridDiv.style.flexWrap = "wrap";
        gridDiv.style.justifyContent = "center";
        gridDiv.style.width = "100%";
        gridDiv.style.maxWidth = "1200px";

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
            titleP.style.marginBottom = "2px";
            titleP.style.height = "3em";
            titleP.style.overflow = "hidden";
            titleP.style.textOverflow = "ellipsis";
            titleP.style.whiteSpace = "normal";
            titleP.innerText = song.title;

            const scoreP = document.createElement("p");
            scoreP.style.fontSize = "12px";
            scoreP.style.color = "#aaa";
            scoreP.innerText = `スコア: ${song.score}`;

            card.appendChild(img);
            card.appendChild(titleP);
            card.appendChild(scoreP);
            gridDiv.appendChild(card);
        }
        modalBody.appendChild(gridDiv);
        document.body.appendChild(modalOverlay);
        statusDiv.innerText = "モーダルを表示しました！";

        // --- 4. ボタンのイベントリスナーを設定 ---
        closeButton.onclick = () => {
            modalOverlay.remove();
            document.body.style.overflow = "auto";
        };

        downloadButton.onclick = () => {
            downloadButton.disabled = true;
            downloadButton.innerText = "生成中...";
            const script = document.createElement("script");
            script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
            script.onload = async () => {
                try {
                    const canvasTarget = document.getElementById("chunithm-chart-container-for-canvas");
                    const canvas = await html2canvas(canvasTarget, {
                        backgroundColor: "#1c1c1e",
                        useCORS: true,
                        allowTaint: true
                    });
                    
                    canvas.toBlob(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = `chunithm_rating_${now.toISOString().slice(0, 10)}.png`;
                        link.click();
                        URL.revokeObjectURL(blobUrl);
                        downloadButton.innerText = "完了!";
                        setTimeout(() => {
                           downloadButton.disabled = false;
                           downloadButton.innerText = "ダウンロード";
                        }, 2000);
                    }, 'image/png');

                } catch (e) {
                    alert("画像生成中にエラーが発生しました: " + e.message);
                    downloadButton.disabled = false;
                    downloadButton.innerText = "ダウンロード";
                }
            };
            document.body.appendChild(script);
        };
        // ▲▲▲ ここまでが新しいモーダル表示の処理 ▲▲▲

    } catch (e) {
        alert("エラーが発生しました: " + e.message);
        console.error(e);
    } finally {
        setTimeout(() => statusDiv.remove(), 2000);
    }
})();
