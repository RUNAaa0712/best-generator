javascript:(async () => {
    // Google FontsからOrbitronを読み込む
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

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

    const API_ENDPOINT = 'https://runaaa0712.weblike.jp/api/chunithm/v1/const/query.php';
    const difficultyMap = {'0': 'BASIC', '1': 'ADVANCED', '2': 'EXPERT', '3': 'MASTER', '4': 'ULTIMA'};
    const proxyUrl = 'https://runaaa0712.weblike.jp/api/chunithm/v1/send-best-rating.php';

    const modalOverlay = document.createElement("div");
    modalOverlay.id = "progress-modal";
    Object.assign(modalOverlay.style, {
        position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.75)", zIndex: "10000",
        display: "flex", justifyContent: "center", alignItems: "center",
        color: "#333", fontFamily: "'Helvetica Neue', Arial, sans-serif"
    });

    const modalContent = document.createElement("div");
    Object.assign(modalContent.style, {
        backgroundColor: "white", padding: "30px 40px", borderRadius: "10px",
        textAlign: "center", boxShadow: "0 5px 15px rgba(0,0,0,0.3)"
    });

    const progressText = document.createElement("p");
    progressText.innerText = "データを取得しています...";
    Object.assign(progressText.style, {
        fontSize: "18px", fontWeight: "bold", margin: "0 0 10px 0"
    });

    const songTitleText = document.createElement("p");
    songTitleText.innerText = "準備中...";
    Object.assign(songTitleText.style, {
        fontSize: "16px", margin: "0", minHeight: "20px"
    });

    modalContent.appendChild(progressText);
    modalContent.appendChild(songTitleText);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    try {
        progressText.innerText = "必要なページ情報を取得中...";
        songTitleText.innerText = "プレイヤー情報 / ベスト枠一覧";
        
        const [homeHtml, ratingHtml] = await Promise.all([
            fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/home/").then(res => res.text()),
            fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/home/playerData/ratingDetailBest/").then(res => res.text())
        ]);
        const parser = new DOMParser();
        let playerName = "プレイヤー情報なし";
        try { const homeDoc = parser.parseFromString(homeHtml, "text/html"); playerName = homeDoc.querySelector(".player_name_in").innerText.trim(); } catch (e) { console.error("プレイヤー名の取得に失敗:", e); }
        const ratingDoc = parser.parseFromString(ratingHtml, "text/html");
        const musicForms = Array.from(ratingDoc.querySelectorAll(".box05 > form"));
        if (musicForms.length === 0) { throw new Error("レーティング対象曲が見つかりません。\nCHUNITHM-NETにログインしているか確認してください。"); }

        const collectedData = [];
        for (let i = 0; i < musicForms.length; i++) {
            const form = musicForms[i];
            const musicTitle = form.querySelector(".music_title").innerText.trim();
            
            progressText.innerText = `楽曲データを取得中... (${i + 1}/${musicForms.length})`;
            songTitleText.innerText = musicTitle;

            const scoreStr = form.querySelector(".play_musicdata_highscore .text_b").innerText.trim();
            const scoreInt = parseInt(scoreStr.replace(/,/g, ''), 10);
            const diffValue = new FormData(form).get('diff');
            const difficultyString = difficultyMap[diffValue] || 'UNKNOWN';
            let jacketUrl = "取得失敗"; let playCount = "取得失敗"; let musicConstant = "N/A"; let ratingValue = "---";

            try { const postBody = new URLSearchParams(new FormData(form)).toString(); const response = await fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/record/musicGenre/sendMusicDetail/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: postBody, }); const detailHtml = await response.text(); const detailDoc = new DOMParser().parseFromString(detailHtml, "text/html"); jacketUrl = detailDoc.querySelector(".play_jacket_img img")?.src || "取得失敗"; const diffClass = diffValue === '4' ? '.bg_ultima' : '.bg_master'; const targetBlock = detailDoc.querySelector(diffClass); if (targetBlock) { const allTitles = targetBlock.querySelectorAll('.musicdata_score_title'); for (const titleElement of allTitles) { if (titleElement.innerText.includes('プレイ回数')) { playCount = titleElement.nextElementSibling.innerText.trim(); break; } } } } catch (e) { console.error(`「${musicTitle}」の詳細取得エラー:`, e); }
            try { const apiResponse = await fetch(`${API_ENDPOINT}?song=${encodeURIComponent(musicTitle)}&difficulty=${difficultyString}`); if (apiResponse.ok) { const data = await apiResponse.json(); if (data && data['定数値']) { musicConstant = data['定数値']; ratingValue = calculateRatingValue(scoreInt, parseFloat(musicConstant)); } } else { console.warn(`「${musicTitle}」の定数取得に失敗: Status ${apiResponse.status}`); } } catch (e) { console.error(`「${musicTitle}」のAPI通信エラー:`, e); }

            collectedData.push({ title: musicTitle, score: scoreStr, jacketUrl, playCount, constant: musicConstant, ratingValue, diffValue });
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        let totalRating = 0;
        let validRatingCount = 0;
        collectedData.forEach(song => {
            const r = parseFloat(song.ratingValue);
            if (!isNaN(r)) { totalRating += r; validRatingCount++; }
        });
        const averageRating = validRatingCount > 0 ? (totalRating / validRatingCount).toFixed(4) : "算出不可";

        progressText.innerText = "画像を生成中...";
        songTitleText.innerText = "しばらくお待ちください...";
        
        const container = document.createElement("div");
        container.id = "chunithm-chart-container"; Object.assign(container.style, { position: "absolute", left: "-9999px", top: "0", width: "1240px", backgroundColor: "#1c1c1e", zIndex: "-1", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "'Helvetica Neue', Arial, sans-serif", boxSizing: "border-box" });
        
        const topHeader = document.createElement('div');
        Object.assign(topHeader.style, { width: '100%', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2a2a2e', color: 'white', boxSizing: 'border-box' });
        const topTitle = document.createElement('h1');
        topTitle.innerText = 'るなぁぁ版べ枠ジェネレーター'; Object.assign(topTitle.style, { margin: '0', fontSize: '28px', fontWeight: 'bold' });
        const topCredit = document.createElement('p');
        topCredit.innerText = 'Creator：@RuuNaa00'; Object.assign(topCredit.style, { margin: '0', fontSize: '16px', color: '#aaa' });
        topHeader.appendChild(topTitle); topHeader.appendChild(topCredit); container.appendChild(topHeader);
        
        const now = new Date(); const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const playerInfoHeader = document.createElement("div");
        Object.assign(playerInfoHeader.style, { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", margin: "20px 0", boxSizing: "border-box" });
        const leftInfoContainer = document.createElement('div');
        
        const nameElement = document.createElement("h2");
        nameElement.innerText = `Player: ${playerName}`; 
        Object.assign(nameElement.style, { color: "#eee", margin: "0 0 12px 0", fontSize: "32px", fontWeight: "bold" });
        
        const averageElement = document.createElement("p");
        averageElement.innerText = `BEST枠平均RATE: ${averageRating}`; 
        Object.assign(averageElement.style, { color: "#ffb84b", margin: "0", fontSize: "24px", fontWeight: "bold" });
        leftInfoContainer.appendChild(nameElement); leftInfoContainer.appendChild(averageElement);
        const timeElement = document.createElement("p");
        timeElement.innerText = `Generated: ${timestamp}`; Object.assign(timeElement.style, { color: "#aaa", margin: "0", fontSize: "16px" });
        playerInfoHeader.appendChild(leftInfoContainer); playerInfoHeader.appendChild(timeElement); container.appendChild(playerInfoHeader);
        
        const gridDiv = document.createElement("div");
        Object.assign(gridDiv.style, { display: "flex", flexWrap: "wrap", justifyContent: "center", width: "100%", padding: "0 10px", boxSizing: "border-box" });
        collectedData.forEach((song, index) => {
            const card = document.createElement("div");
            Object.assign(card.style, { width: "calc(20% - 20px)", margin: "10px", backgroundColor: "#222", color: "#eee", borderRadius: "8px", boxSizing: "border-box", textAlign: "center", position: 'relative', border: '3px solid transparent' });
            
            const difficultyColors = { '3': '#800080', '4': '#000000' }; 
            if (difficultyColors[song.diffValue]) {
                card.style.borderColor = difficultyColors[song.diffValue];
            }
            
            const img = document.createElement("img"); 
            img.src = song.jacketUrl; 
            Object.assign(img.style, { width: "100%", height: "auto", borderRadius: "4px 4px 0 0", borderBottom: "1px solid #444", display: 'block' });
            card.appendChild(img);

            // ▼▼▼ 変更点: ナンバリングを詳細エリアの背景に配置 ▼▼▼

            // 詳細エリアのコンテナを作成
            const detailsContainer = document.createElement('div');
            Object.assign(detailsContainer.style, {
                position: 'relative',
                padding: '8px 4px 4px 4px',
                overflow: 'hidden'
            });
            card.appendChild(detailsContainer);

            // 背景用の大きいナンバリングを作成
            const bigNumber = document.createElement('div');
            bigNumber.innerText = `#${index + 1}`;
            Object.assign(bigNumber.style, {
                position: 'absolute',
                right: '-10px',
                bottom: '-25px',
                fontSize: '80px',
                fontWeight: '900',
                fontFamily: 'Orbitron, sans-serif',
                color: 'rgba(255, 255, 255, 0.1)',
                zIndex: '0',
                lineHeight: '1',
                userSelect: 'none'
            });
            detailsContainer.appendChild(bigNumber);

            // 曲名やスコアなどのテキスト要素のスタイル（前面に表示するための設定）
            const textStyle = { position: 'relative', zIndex: '1' };
            
            const titleP = document.createElement("p"); 
            titleP.innerText = song.title; 
            Object.assign(titleP.style, textStyle, { fontWeight: "bold", fontSize: "14px", marginBottom: "4px", height: "3.2em", lineHeight: "1.6em", overflow: "hidden" });
            
            const scoreValue = parseInt(song.score.replace(/,/g, ''), 10);
            let rank = ''; let rankColor = '#eee';
            if (scoreValue >= 1009000) { rank = 'SSS+'; rankColor = '#ffb84b'; } else if (scoreValue >= 1007500) { rank = 'SSS'; rankColor = '#ffd700'; } else if (scoreValue >= 1005000) { rank = 'SS+'; rankColor = '#f0f0f0'; } else if (scoreValue >= 1000000) { rank = 'SS'; rankColor = '#e0e0e0'; }
            const scoreP = document.createElement("p"); 
            scoreP.innerHTML = `スコア: ${song.score} <span style="color:${rankColor}; font-weight:bold;">${rank}</span>`; 
            Object.assign(scoreP.style, textStyle, { fontSize: "13px", color: "#ccc", margin: "0 0 4px 0" });
            
            const constantP = document.createElement("p"); 
            constantP.innerText = `定数: ${song.constant}`; 
            Object.assign(constantP.style, textStyle, { fontSize: "13px", color: "#aadeff", margin: "0 0 4px 0", fontWeight: 'bold' });
            
            const ratingValueP = document.createElement("p"); 
            ratingValueP.innerText = `RATE: ${song.ratingValue}`; 
            Object.assign(ratingValueP.style, textStyle, { fontSize: "14px", color: "#ffb84b", margin: "0 0 4px 0", fontWeight: 'bold', border: '1px solid #555', borderRadius: '4px', padding: '2px 0', backgroundColor: '#333' });
            
            const playCountP = document.createElement("p"); 
            playCountP.innerText = `プレイ回数: ${song.playCount}`; 
            Object.assign(playCountP.style, textStyle, { fontSize: "12px", color: "#888", margin: "0" });
            
            detailsContainer.appendChild(titleP); 
            detailsContainer.appendChild(scoreP); 
            detailsContainer.appendChild(constantP); 
            detailsContainer.appendChild(ratingValueP); 
            detailsContainer.appendChild(playCountP);
            // ▲▲▲ ここまで ▲▲▲

            gridDiv.appendChild(card);
        });
        container.appendChild(gridDiv);

        const footer = document.createElement('div');
        Object.assign(footer.style, { width: '100%', padding: '20px', marginTop: '20px', color: '#777', fontSize: '12px', textAlign: 'center', boxSizing: 'border-box', borderTop: '1px solid #444' });
        footer.innerHTML = `この画像はCHUNITHM-NETの表示内容を元に、ブックマークレットによって作成されました。<br>この画像は非公式ツールによって生成されたものであり、SEGA公式とは一切関係ありません。<br>楽曲ジャケット画像の著作権は、全て著作権所持者に帰属します。<br><br>本ページの情報はchunirecおよび<a href="https://chuni.kichi2004.jp/charts" target="_blank" rel="noopener noreferrer" style="color: #aadeff; text-decoration: none;">譜面定数メインフレーム</a>様のデータに基づきます。楽曲の定数は正確ではない場合があります。`;
        container.appendChild(footer);
        document.body.appendChild(container);

        const script = document.createElement("script"); script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
        script.onload = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 500)); 
                const canvas = await html2canvas(container, { backgroundColor: "#1c1c1e", useCORS: true, allowTaint: true });

                try {
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    if (blob) {
                        const formData = new FormData();
                        formData.append('file', blob, 'chunithm_best_rating.png');
                        formData.append('payload_json', JSON.stringify({
                            username: "CHUNITHMべ枠ジェネレーター",
                            content: `**${playerName}** さんのベスト枠 (平均RATE: **${averageRating}**)`
                        }));
                        const response = await fetch(proxyUrl, { method: 'POST', body: formData });
                        if (!response.ok) { console.error(`プロキシサーバーへの送信に失敗しました: ${response.status}`); }
                    }
                } catch (err) { console.error('画像送信処理中にエラーが発生しました:', err); }
                
                const dataUrl = canvas.toDataURL("image/png");
                const newTab = window.open();
                if (newTab) {
                    newTab.document.write(`<html><head><title>CHUNITHM Rating Chart</title><style>body{margin:0; background-color:black;}</style></head><body><img src="${dataUrl}" style="width:100%; max-width:100%; height:auto;"></body></html>`);
                    newTab.document.close();
                    progressText.innerText = "完了！";
                    songTitleText.innerText = "新しいタブで画像を開きました！";
                } else {
                    throw new Error('ポップアップがブロックされました。');
                }
            } catch (e) {
                throw e;
            } finally {
                container.remove();
            }
        };
        document.body.appendChild(script);

    } catch (e) {
        alert(e.message);
        if (modalOverlay) modalOverlay.remove();
    } finally {
        setTimeout(() => {
            if (modalOverlay) modalOverlay.remove();
        }, 3000);
    }
})();
