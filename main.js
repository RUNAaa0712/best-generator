// CHUNITHM Rating Image Generator - Main Script (v6 - Final / New Tab Save)

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

        statusDiv.innerText = "画像を生成中...";

        const container = document.createElement("div");
        container.id = "chunithm-chart-container";
        container.style.position = "absolute";
        container.style.left = "-9999px";
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
        container.appendChild(gridDiv);
        document.body.appendChild(container);

        const script = document.createElement("script");
        script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
        script.onload = async () => {
            try {
                const canvas = await html2canvas(container, { backgroundColor: "#1c1c1e", useCORS: true, allowTaint: true, width: 1240, windowWidth: 1240 });
                
                canvas.toBlob(blob => {
                    const blobUrl = URL.createObjectURL(blob);
                    // 新しいタブで画像を開く
                    window.open(blobUrl, '_blank');
                    statusDiv.innerText = "新しいタブで画像を開きました！";
                }, 'image/png');

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
        setTimeout(() => statusDiv.remove(), 3000);
    }
})();
