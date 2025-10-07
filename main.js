javascript:(async () => {
    // ステータス表示用のUIを作成
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
        // ホーム画面とレーティング対象曲ページのHTMLを同時に取得
        const [homeHtml, ratingHtml] = await Promise.all([
            fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/home/").then(res => res.text()),
            fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/home/playerData/ratingDetailBest/").then(res => res.text())
        ]);

        const parser = new DOMParser();
        
        // プレイヤー名を取得
        let playerName = "プレイヤー情報なし";
        try {
            const homeDoc = parser.parseFromString(homeHtml, "text/html");
            playerName = homeDoc.querySelector(".player_name_in").innerText.trim();
        } catch (e) {
            console.error("プレイヤー名の取得に失敗:", e);
        }

        const ratingDoc = parser.parseFromString(ratingHtml, "text/html");
        const musicForms = Array.from(ratingDoc.querySelectorAll(".box05 > form"));

        if (musicForms.length === 0) {
            alert("レーティング対象曲のデータが見つかりませんでした。\nCHUNITHM-NETにログインしているか確認してください。");
            statusDiv.remove();
            return;
        }

        const collectedData = [];
        let counter = 0;

        for (const form of musicForms) {
            counter++;
            statusDiv.innerText = `楽曲データを取得中... (${counter}/${musicForms.length})`;
            
            const musicTitle = form.querySelector(".music_title").innerText.trim();
            const score = form.querySelector(".play_musicdata_highscore .text_b").innerText.trim();
            const diffValue = new FormData(form).get('diff');
            
            let jacketUrl = "取得失敗";
            let playCount = "取得失敗";

            try {
                const postBody = new URLSearchParams(new FormData(form)).toString();
                const response = await fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/record/musicGenre/sendMusicDetail/", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: postBody,
                });
                const detailHtml = await response.text();
                const detailDoc = new DOMParser().parseFromString(detailHtml, "text/html");
                
                jacketUrl = detailDoc.querySelector(".play_jacket_img img")?.src || "取得失敗";
                
                const diffClass = diffValue === '4' ? '.bg_ultima' : '.bg_master';
                const targetBlock = detailDoc.querySelector(diffClass);

                if (targetBlock) {
                    const allTitles = targetBlock.querySelectorAll('.musicdata_score_title');
                    for(const titleElement of allTitles) {
                        if(titleElement.innerText.includes('プレイ回数')) {
                            playCount = titleElement.nextElementSibling.innerText.trim();
                            break;
                        }
                    }
                }

            } catch (e) {
                console.error(`「${musicTitle}」の詳細取得エラー:`, e);
            }
            
            collectedData.push({ title: musicTitle, score: score, jacketUrl: jacketUrl, playCount: playCount });
            await new Promise(resolve => setTimeout(resolve, 500));
        }

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
        container.style.fontFamily = "'Helvetica Neue', Arial, sans-serif";
        container.style.boxSizing = "border-box";

        // --- 新しいヘッダー ---
        const topHeader = document.createElement('div');
        topHeader.style.width = '100%';
        topHeader.style.padding = '15px 25px';
        topHeader.style.display = 'flex';
        topHeader.style.justifyContent = 'space-between';
        topHeader.style.alignItems = 'center';
        topHeader.style.background = '#2a2a2e';
        topHeader.style.color = 'white';
        topHeader.style.boxSizing = 'border-box';
        const topTitle = document.createElement('h1');
        topTitle.innerText = 'るなぁぁ版べ枠ジェネレーター';
        topTitle.style.margin = '0';
        topTitle.style.fontSize = '28px';
        topTitle.style.fontWeight = 'bold';
        const topCredit = document.createElement('p');
        topCredit.innerText = 'Creator：るなぁぁ';
        topCredit.style.margin = '0';
        topCredit.style.fontSize = '16px';
        topCredit.style.color = '#aaa';
        topHeader.appendChild(topTitle);
        topHeader.appendChild(topCredit);
        container.appendChild(topHeader);
        
        const now = new Date();
        const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        
        const playerInfoHeader = document.createElement("div");
        playerInfoHeader.style.width = "100%";
        playerInfoHeader.style.display = "flex";
        playerInfoHeader.style.justifyContent = "space-between";
        playerInfoHeader.style.alignItems = "center";
        playerInfoHeader.style.padding = "20px";
        playerInfoHeader.style.margin = "20px 0";
        playerInfoHeader.style.boxSizing = "border-box";

        const nameElement = document.createElement("h2");
        nameElement.innerText = `Player: ${playerName}`;
        nameElement.style.color = "#eee";
        nameElement.style.margin = "0";
        nameElement.style.fontSize = "22px";

        const timeElement = document.createElement("p");
        timeElement.innerText = `Generated: ${timestamp}`;
        timeElement.style.color = "#aaa";
        timeElement.style.margin = "0";
        timeElement.style.fontSize = "16px";

        playerInfoHeader.appendChild(nameElement);
        playerInfoHeader.appendChild(timeElement);
        container.appendChild(playerInfoHeader);

        const gridDiv = document.createElement("div");
        gridDiv.style.display = "flex";
        gridDiv.style.flexWrap = "wrap";
        gridDiv.style.justifyContent = "center";
        gridDiv.style.width = "100%";
        gridDiv.style.padding = "0 10px";
        gridDiv.style.boxSizing = "border-box";

        for (const song of collectedData) {
            const card = document.createElement("div");
            card.style.width = "calc(20% - 20px)";
            card.style.margin = "10px";
            card.style.backgroundColor = "#222";
            card.style.color = "#eee";
            card.style.padding = "10px";
            card.style.borderRadius = "8px";
            card.style.boxSizing = "border-box";
            card.style.textAlign = "center";
            
            const img = document.createElement("img");
            img.src = song.jacketUrl;
            img.style.width = "100%";
            img.style.height = "auto";
            img.style.borderRadius = "4px";
            img.style.marginBottom = "8px";
            img.style.border = "1px solid #444";

            const titleP = document.createElement("p");
            titleP.style.fontWeight = "bold";
            titleP.style.fontSize = "14px";
            titleP.style.marginBottom = "4px";
            titleP.style.height = "3.2em";
            titleP.style.lineHeight = "1.6em";
            titleP.style.overflow = "hidden";
            titleP.innerText = song.title;

            const scoreValue = parseInt(song.score.replace(/,/g, ''), 10);
            let rank = '';
            let rankColor = '#eee';
            if (scoreValue >= 1009000) { rank = 'SSS+'; rankColor = '#ffb84b'; }
            else if (scoreValue >= 1007500) { rank = 'SSS'; rankColor = '#ffd700'; }
            else if (scoreValue >= 1005000) { rank = 'SS+'; rankColor = '#f0f0f0'; }
            else if (scoreValue >= 1000000) { rank = 'SS'; rankColor = '#e0e0e0'; }

            const scoreP = document.createElement("p");
            scoreP.style.fontSize = "13px";
            scoreP.style.color = "#ccc";
            scoreP.style.margin = "0 0 4px 0";
            scoreP.innerHTML = `スコア: ${song.score} <span style="color:${rankColor}; font-weight:bold;">${rank}</span>`;
            
            const playCountP = document.createElement("p");
            playCountP.style.fontSize = "12px";
            playCountP.style.color = "#888";
            playCountP.style.margin = "0";
            playCountP.innerText = `プレイ回数: ${song.playCount}`;

            card.appendChild(img);
            card.appendChild(titleP);
            card.appendChild(scoreP);
            card.appendChild(playCountP);
            gridDiv.appendChild(card);
        }
        container.appendChild(gridDiv);

        // --- 新しいフッター ---
        const footer = document.createElement('div');
        footer.style.width = '100%';
        footer.style.padding = '20px';
        footer.style.marginTop = '20px';
        footer.style.color = '#777';
        footer.style.fontSize = '12px';
        footer.style.textAlign = 'center';
        footer.style.boxSizing = 'border-box';
        footer.style.borderTop = '1px solid #444';
        footer.innerHTML = 'この画像はCHUNITHM-NETの表示内容を元に、ブックマークレットによって作成されました。<br>この画像は非公式ツールによって生成されたものであり、SEGA公式とは一切関係ありません。';
        container.appendChild(footer);

        document.body.appendChild(container);

        const script = document.createElement("script");
        script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
        script.onload = async () => {
            try {
                const canvas = await html2canvas(container, { backgroundColor: "#1c1c1e", useCORS: true, allowTaint: true });
                const dataUrl = canvas.toDataURL("image/png");
                const newTab = window.open();
                if (newTab) {
                    newTab.document.write(`<html><head><title>CHUNITHM Rating Chart</title><style>body{margin:0; background-color:black;}</style></head><body><img src="${dataUrl}" style="width:100%; max-width:100%; height:auto;"></body></html>`);
                    newTab.document.close();
                    statusDiv.innerText = "新しいタブで画像を開きました！";
                } else {
                    alert('ポップアップがブロックされました。このサイトのポップアップを許可してください。');
                }
            } catch (e) {
                alert("画像生成中にエラーが発生しました: " + e.message);
            } finally {
                container.remove();
            }
        };
        document.body.appendChild(script);

    } catch (e) {
        alert("エラーが発生しました: " + e.message);
    } finally {
        setTimeout(() => statusDiv.remove(), 3000);
    }
})();
