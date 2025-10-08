javascript:(async () => {
    const API_ENDPOINT = 'https://runaaa0712.weblike.jp/api/chunithm/v1/const/query.php';
    const difficultyMap = {'0': 'BASIC', '1': 'ADVANCED', '2': 'EXPERT', '3': 'MASTER', '4': 'ULTIMA'};

    const calculateRatingValue = (score, constant) => {
        if (typeof score !== 'number' || typeof constant !== 'number' || isNaN(score) || isNaN(constant)) { return "---"; }
        let rating = 0;
        if (score >= 1009000) { rating = constant + 2.15; }
        else if (score >= 1007500) { rating = constant + 2.0 + (score - 1007500) / 10000; }
        else if (score >= 1005000) { rating = constant + 1.5 + (score - 1005000) / 5000; }
        else if (score >= 1000000) { rating = constant + 1.0 + (score - 1000000) / 10000; }
        else if (score >= 975000) { rating = constant + (score - 975000) / 25000; }
        else if (score >= 900000) { rating = constant - 5.0 + (score - 900000) / 15000; }
        else { rating = 0; }
        return Math.max(0, rating).toFixed(4);
    };

    const statusDiv = document.createElement("div");
    statusDiv.style.position = "fixed"; statusDiv.style.top = "10px"; statusDiv.style.left = "10px"; statusDiv.style.padding = "10px"; statusDiv.style.backgroundColor = "black"; statusDiv.style.color = "white"; statusDiv.style.zIndex = "9999"; statusDiv.innerText = "データを取得しています..."; document.body.appendChild(statusDiv);

    try {
        statusDiv.innerText = "必要なページ情報を取得中...";
        const [homeHtml, ratingHtml] = await Promise.all([
            fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/home/").then(res => res.text()),
            fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/home/playerData/ratingDetailBest/").then(res => res.text())
        ]);
        const parser = new DOMParser();
        let playerName = "プレイヤー情報なし";
        try { const homeDoc = parser.parseFromString(homeHtml, "text/html"); playerName = homeDoc.querySelector(".player_name_in").innerText.trim(); } catch (e) { console.error("プレイヤー名の取得に失敗:", e); }
        const ratingDoc = parser.parseFromString(ratingHtml, "text/html");
        const musicForms = Array.from(ratingDoc.querySelectorAll(".box05 > form"));
        if (musicForms.length === 0) { alert("レーティング対象曲のデータが見つかりませんでした。\nCHUNITHM-NETにログインしているか確認してください。"); statusDiv.remove(); return; }

        const collectedData = [];
        for (let i = 0; i < musicForms.length; i++) {
            const form = musicForms[i];
            statusDiv.innerText = `楽曲データと定数を取得中... (${i + 1}/${musicForms.length})`;
            const musicTitle = form.querySelector(".music_title").innerText.trim();
            const scoreStr = form.querySelector(".play_musicdata_highscore .text_b").innerText.trim();
            const scoreInt = parseInt(scoreStr.replace(/,/g, ''), 10);
            const diffValue = new FormData(form).get('diff');
            const difficultyString = difficultyMap[diffValue] || 'UNKNOWN';
            let jacketUrl = "取得失敗"; let playCount = "取得失敗"; let musicConstant = "N/A"; let ratingValue = "---";

            try { const postBody = new URLSearchParams(new FormData(form)).toString(); const response = await fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/record/musicGenre/sendMusicDetail/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: postBody, }); const detailHtml = await response.text(); const detailDoc = new DOMParser().parseFromString(detailHtml, "text/html"); jacketUrl = detailDoc.querySelector(".play_jacket_img img")?.src || "取得失敗"; const diffClass = diffValue === '4' ? '.bg_ultima' : '.bg_master'; const targetBlock = detailDoc.querySelector(diffClass); if (targetBlock) { const allTitles = targetBlock.querySelectorAll('.musicdata_score_title'); for (const titleElement of allTitles) { if (titleElement.innerText.includes('プレイ回数')) { playCount = titleElement.nextElementSibling.innerText.trim(); break; } } } } catch (e) { console.error(`「${musicTitle}」の詳細取得エラー:`, e); }
            try { const apiResponse = await fetch(`${API_ENDPOINT}?song=${encodeURIComponent(musicTitle)}&difficulty=${difficultyString}`); if (apiResponse.ok) { const data = await apiResponse.json(); if (data && data['定数値']) { musicConstant = data['定数値']; ratingValue = calculateRatingValue(scoreInt, parseFloat(musicConstant)); } } else { console.warn(`「${musicTitle}」の定数取得に失敗: Status ${apiResponse.status}`); } } catch (e) { console.error(`「${musicTitle}」のAPI通信エラー:`, e); }

            collectedData.push({ title: musicTitle, score: scoreStr, jacketUrl, playCount, constant: musicConstant, ratingValue });
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ベスト枠平均RATEを計算
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        let totalRating = 0;
        let validRatingCount = 0;
        collectedData.forEach(song => {
            const r = parseFloat(song.ratingValue); // 計算対象を ratingValue に変更
            if (!isNaN(r)) {
                totalRating += r;
                validRatingCount++;
            }
        });
        const averageRating = validRatingCount > 0 ? (totalRating / validRatingCount).toFixed(4) : "算出不可";


        statusDiv.innerText = "画像を生成中...";
        const container = document.createElement("div");
        container.id = "chunithm-chart-container"; container.style.position = "absolute"; container.style.left = "-9999px"; container.style.top = "0"; container.style.width = "1240px"; container.style.backgroundColor = "#1c1c1e"; container.style.zIndex = "-1"; container.style.display = "flex"; container.style.flexDirection = "column"; container.style.alignItems = "center"; container.style.fontFamily = "'Helvetica Neue', Arial, sans-serif"; container.style.boxSizing = "border-box";
        
        const topHeader = document.createElement('div');
        topHeader.style.width = '100%'; topHeader.style.padding = '15px 25px'; topHeader.style.display = 'flex'; topHeader.style.justifyContent = 'space-between'; topHeader.style.alignItems = 'center'; topHeader.style.background = '#2a2a2e'; topHeader.style.color = 'white'; topHeader.style.boxSizing = 'border-box';
        const topTitle = document.createElement('h1');
        topTitle.innerText = 'るなぁぁ版べ枠ジェネレーター'; topTitle.style.margin = '0'; topTitle.style.fontSize = '28px'; topTitle.style.fontWeight = 'bold';
        const topCredit = document.createElement('p');
        topCredit.innerText = 'Creator：@RuuNaa00'; 
        topCredit.style.margin = '0'; topCredit.style.fontSize = '16px'; topCredit.style.color = '#aaa';
        topHeader.appendChild(topTitle); topHeader.appendChild(topCredit); container.appendChild(topHeader);
        
        const now = new Date(); const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const playerInfoHeader = document.createElement("div"); playerInfoHeader.style.width = "100%"; playerInfoHeader.style.display = "flex"; playerInfoHeader.style.justifyContent = "space-between"; playerInfoHeader.style.alignItems = "center"; playerInfoHeader.style.padding = "20px"; playerInfoHeader.style.margin = "20px 0"; playerInfoHeader.style.boxSizing = "border-box";
        
        const leftInfoContainer = document.createElement('div');
        const nameElement = document.createElement("h2");
        nameElement.innerText = `Player: ${playerName}`; nameElement.style.color = "#eee"; nameElement.style.margin = "0 0 8px 0"; nameElement.style.fontSize = "22px";
        
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // 平均RATE表示要素を作成
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        const averageElement = document.createElement("p");
        averageElement.innerText = `BEST枠平均RATE: ${averageRating}`; // 表示名を変更
        averageElement.style.color = "#ffb84b"; // RATEと同じ色に変更
        averageElement.style.margin = "0"; averageElement.style.fontSize = "16px"; averageElement.style.fontWeight = "bold";

        leftInfoContainer.appendChild(nameElement);
        leftInfoContainer.appendChild(averageElement);

        const timeElement = document.createElement("p"); timeElement.innerText = `Generated: ${timestamp}`; timeElement.style.color = "#aaa"; timeElement.style.margin = "0"; timeElement.style.fontSize = "16px";
        playerInfoHeader.appendChild(leftInfoContainer); playerInfoHeader.appendChild(timeElement); container.appendChild(playerInfoHeader);
        
        const gridDiv = document.createElement("div"); gridDiv.style.display = "flex"; gridDiv.style.flexWrap = "wrap"; gridDiv.style.justifyContent = "center"; gridDiv.style.width = "100%"; gridDiv.style.padding = "0 10px"; gridDiv.style.boxSizing = "border-box";
        
        collectedData.forEach((song, index) => {
            const card = document.createElement("div");
            card.style.width = "calc(20% - 20px)"; card.style.margin = "10px"; card.style.backgroundColor = "#222"; card.style.color = "#eee"; card.style.padding = "10px"; card.style.borderRadius = "8px"; card.style.boxSizing = "border-box"; card.style.textAlign = "center"; card.style.position = 'relative';
            const numberDiv = document.createElement('div'); numberDiv.innerText = index + 1; numberDiv.style.position = 'absolute'; numberDiv.style.top = '2px'; numberDiv.style.right = '2px'; numberDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; numberDiv.style.color = 'white'; numberDiv.style.width = '24px'; numberDiv.style.height = '24px'; numberDiv.style.borderRadius = '50%'; numberDiv.style.display = 'flex'; numberDiv.style.alignItems = 'center'; numberDiv.style.justifyContent = 'center'; numberDiv.style.fontSize = '14px'; numberDiv.style.fontWeight = 'bold'; card.appendChild(numberDiv);
            const img = document.createElement("img"); img.src = song.jacketUrl; img.style.width = "100%"; img.style.height = "auto"; img.style.borderRadius = "4px"; img.style.marginBottom = "8px"; img.style.border = "1px solid #444";
            const titleP = document.createElement("p"); titleP.style.fontWeight = "bold"; titleP.style.fontSize = "14px"; titleP.style.marginBottom = "4px"; titleP.style.height = "3.2em"; titleP.style.lineHeight = "1.6em"; titleP.style.overflow = "hidden"; titleP.innerText = song.title;
            const scoreValue = parseInt(song.score.replace(/,/g, ''), 10);
            let rank = ''; let rankColor = '#eee';
            if (scoreValue >= 1009000) { rank = 'SSS+'; rankColor = '#ffb84b'; } else if (scoreValue >= 1007500) { rank = 'SSS'; rankColor = '#ffd700'; } else if (scoreValue >= 1005000) { rank = 'SS+'; rankColor = '#f0f0f0'; } else if (scoreValue >= 1000000) { rank = 'SS'; rankColor = '#e0e0e0'; }
            const scoreP = document.createElement("p"); scoreP.style.fontSize = "13px"; scoreP.style.color = "#ccc"; scoreP.style.margin = "0 0 4px 0"; scoreP.innerHTML = `スコア: ${song.score} <span style="color:${rankColor}; font-weight:bold;">${rank}</span>`;
            const constantP = document.createElement("p"); constantP.style.fontSize = "13px"; constantP.style.color = "#aadeff"; constantP.style.margin = "0 0 4px 0"; constantP.style.fontWeight = 'bold'; constantP.innerText = `定数: ${song.constant}`;
            const ratingValueP = document.createElement("p"); ratingValueP.style.fontSize = "14px"; ratingValueP.style.color = "#ffb84b"; ratingValueP.style.margin = "0 0 4px 0"; ratingValueP.style.fontWeight = 'bold'; ratingValueP.style.border = '1px solid #555'; ratingValueP.style.borderRadius = '4px'; ratingValueP.style.padding = '2px 0'; ratingValueP.style.backgroundColor = '#333'; ratingValueP.innerText = `RATE: ${song.ratingValue}`;
            const playCountP = document.createElement("p"); playCountP.style.fontSize = "12px"; playCountP.style.color = "#888"; playCountP.style.margin = "0"; playCountP.innerText = `プレイ回数: ${song.playCount}`;
            card.appendChild(img); card.appendChild(titleP); card.appendChild(scoreP); card.appendChild(constantP); card.appendChild(ratingValueP); card.appendChild(playCountP);
            gridDiv.appendChild(card);
        });
        container.appendChild(gridDiv);

        const footer = document.createElement('div');
        footer.style.width = '100%'; footer.style.padding = '20px'; footer.style.marginTop = '20px'; footer.style.color = '#777'; footer.style.fontSize = '12px'; footer.style.textAlign = 'center'; footer.style.boxSizing = 'border-box'; footer.style.borderTop = '1px solid #444';
        footer.innerHTML = `この画像はCHUNITHM-NETの表示内容を元に、ブックマークレットによって作成されました。<br>
                            この画像は非公式ツールによって生成されたものであり、SEGA公式とは一切関係ありません。<br>
                            楽曲ジャケット画像の著作権は、全て著作権所持者に帰属します。<br><br>
                            本ページの情報はchunirecおよび<a href="https://chuni.kichi2004.jp/charts" target="_blank" rel="noopener noreferrer" style="color: #aadeff; text-decoration: none;">譜面定数メインフレーム</a>様のデータに基づきます。楽曲の定数は正確ではない場合があります。`;
        container.appendChild(footer);
        
        document.body.appendChild(container);

        const script = document.createElement("script"); script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
        script.onload = async () => { try { const canvas = await html2canvas(container, { backgroundColor: "#1c1c1e", useCORS: true, allowTaint: true }); const dataUrl = canvas.toDataURL("image/png"); const newTab = window.open(); if (newTab) { newTab.document.write(`<html><head><title>CHUNITHM Rating Chart</title><style>body{margin:0; background-color:black;}</style></head><body><img src="${dataUrl}" style="width:100%; max-width:100%; height:auto;"></body></html>`); newTab.document.close(); statusDiv.innerText = "新しいタブで画像を開きました！"; } else { alert('ポップアップがブロックされました。このサイトのポップアップを許可してください。'); } } catch (e) { alert("画像生成中にエラーが発生しました: " + e.message); } finally { container.remove(); } };
        document.body.appendChild(script);

    } catch (e) {
        alert("エラーが発生しました: " + e.message);
    } finally {
        setTimeout(() => statusDiv.remove(), 3000);
    }
})();
