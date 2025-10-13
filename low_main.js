((((( 動作不能対策
  (async () => {
  const loadGoogleFont = (fontFamily, weight) => {
    const linkId = `google-font-${fontFamily}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement("link");
    link.id = linkId;
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${weight}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  };

  const calculateRatingValue = (score, constant) => {
    if (
      typeof score !== "number" ||
      typeof constant !== "number" ||
      isNaN(score) ||
      isNaN(constant)
    ) {
      return "---";
    }
    let rating = 0;
    if (score >= 1009000) {
      rating = constant + 2.15;
    } else if (score >= 1007500) {
      rating = constant + 2.0 + (score - 1007500) / 10000;
    } else if (score >= 1005000) {
      rating = constant + 1.5 + (score - 1005000) / 5000;
    } else if (score >= 1000000) {
      rating = constant + 1.0 + (score - 1000000) / 10000;
    } else if (score >= 975000) {
      rating = constant + (score - 975000) / 25000;
    } else if (score >= 900000) {
      rating = constant - 5.0 + (score - 900000) / 15000;
    } else {
      rating = 0;
    }
    return Math.max(0, rating).toFixed(4);
  };

  const showStartConfirmationModal = () => {
    return new Promise((resolve, reject) => {
      const modalOverlay = document.createElement("div");
      Object.assign(modalOverlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        zIndex: "10001",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      });

      const modalContent = document.createElement("div");
      Object.assign(modalContent.style, {
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "10px",
        width: "350px",
        textAlign: "center",
        boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
      });

      modalContent.innerHTML = `
        <h3 style="margin-top:0; margin-bottom:20px; font-size:20px; color:#333;">楽曲データ取得の確認</h3>
        <p style="font-size:15px; margin-bottom:25px; line-height:1.6; text-align:left;">
          CHUNITHM-NETからベスト枠の楽曲データ(30曲)を取得します。<br>
          <strong style="color:red;">⚠️ サーバー負荷軽減のため、毎曲1.2秒の待機時間があります。</strong><br>
          <strong style="color:red;">合計で約1分間の処理を要します。</strong>
        </p>
        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <button id="cancelBtn" style="width:50%; padding:10px; border:1px solid #ccc; border-radius:5px; background-color:#f8f9fa; color:#333; font-size:16px; cursor:pointer;">キャンセル</button>
          <button id="startBtn" style="width:50%; padding:10px; border:none; border-radius:5px; background-color:#007bff; color:white; font-size:16px; font-weight:bold; cursor:pointer;">開始する</button>
        </div>
      `;

      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);

      document.getElementById("startBtn").addEventListener("click", () => {
        modalOverlay.remove();
        resolve();
      });

      document.getElementById("cancelBtn").addEventListener("click", () => {
        modalOverlay.remove();
        reject(new Error("User cancelled"));
      });

      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          modalOverlay.remove();
          reject(new Error("User cancelled"));
        }
      });
    });
  };

  const showSettingsModal = (currentName) => {
    return new Promise((resolve, reject) => {
      const styleA_img_src =
        "https://runaaa0712.weblike.jp/chunithm/best-generator/styleA_img";
      const styleB_img_src =
        "https://runaaa0712.weblike.jp/chunithm/best-generator/styleB_img";
      const editorModalOverlay = document.createElement("div");
      Object.assign(editorModalOverlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        zIndex: "10001",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      });

      const modalContent = document.createElement("div");
      Object.assign(modalContent.style, {
        backgroundColor: "white",
        padding: "25px",
        borderRadius: "10px",
        width: "450px",
        textAlign: "left",
        boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
      });

      modalContent.innerHTML = `
        <style>
          .style-select-container { display: flex; justify-content: space-around; margin-bottom: 20px; border-top: 1px solid #eee; padding-top: 15px; }
          .style-option { text-align: center; cursor: pointer; }
          .style-option img { width: 180px; height: auto; border: 3px solid #ccc; border-radius: 5px; margin-top: 5px; object-fit: contain; }
          .style-option input[type="radio"] { display: none; }
          .style-option input[type="radio"]:checked + label + img { border-color: #007bff; }
          .style-option label { font-size: 16px; font-weight: bold; }
        </style>
        <h3 style="margin-top:0; margin-bottom:20px; font-size:18px; text-align:center;">画像生成オプション</h3>
        <div class="style-select-container">
          <div class="style-option" onclick="document.getElementById('styleA').checked = true;">
            <input type="radio" id="styleA" name="imageStyle" value="A" checked>
            <label for="styleA">スタイルA</label>
            <img src="${styleA_img_src}" alt="スタイルAのサンプル画像">
          </div>
          <div class="style-option" onclick="document.getElementById('styleB').checked = true;">
            <input type="radio" id="styleB" name="imageStyle" value="B">
            <label for="styleB">スタイルB</label>
            <img src="${styleB_img_src}" alt="スタイルBのサンプル画像">
          </div>
        </div>
        <div style="margin-bottom:15px; border-top: 1px solid #eee; padding-top: 15px;">
          <div style="display:flex; align-items:center; cursor:pointer;" id="hideNameLabel">
            <input type="checkbox" id="hideNameCheckbox" style="margin-right:8px; width:18px; height:18px;">
            <label for="hideNameCheckbox" style="font-size:16px; cursor:pointer;">プレイヤー名を隠す</label>
          </div>
          <input type="text" id="customNameInput" placeholder="表示名を入力" style="width:calc(100% - 22px); padding:10px; margin-top:10px; border:1px solid #ccc; border-radius:5px; font-size:16px; background-color:#f1f1f1;" disabled>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 15px; margin-bottom:25px;">
          <div style="display:flex; align-items:center; cursor:pointer;" id="showPlayCountLabel">
            <input type="checkbox" id="showPlayCountCheckbox" style="margin-right:8px; width:18px; height:18px;" checked>
            <label for="showPlayCountCheckbox" style="font-size:16px; cursor:pointer;">プレイ回数を表示</label>
          </div>
        </div>
        <div>
          <button id="generateBtn" style="width:100%; padding:12px; border:none; border-radius:5px; background-color:#007bff; color:white; font-size:16px; font-weight:bold; cursor:pointer;">画像生成</button>
        </div>
      `;

      editorModalOverlay.appendChild(modalContent);
      document.body.appendChild(editorModalOverlay);

      const createToggleHandler = (labelId, checkboxId) => {
        const label = document.getElementById(labelId);
        if (label) {
          label.addEventListener("click", (e) => {
            if (e.target.id !== checkboxId) {
              const checkbox = document.getElementById(checkboxId);
              checkbox.checked = !checkbox.checked;
              checkbox.dispatchEvent(new Event("change"));
            }
          });
        }
      };

      createToggleHandler("hideNameLabel", "hideNameCheckbox");
      createToggleHandler("showPlayCountLabel", "showPlayCountCheckbox");

      document
        .getElementById("hideNameCheckbox")
        .addEventListener("change", (e) => {
          const customNameInput = document.getElementById("customNameInput");
          customNameInput.disabled = !e.target.checked;
          customNameInput.style.backgroundColor = e.target.checked
            ? "white"
            : "#f1f1f1";
          if (e.target.checked) {
            customNameInput.value = "PLAYER";
            customNameInput.focus();
          }
        });

      document.getElementById("generateBtn").addEventListener("click", () => {
        let finalName = currentName;
        if (document.getElementById("hideNameCheckbox").checked) {
          finalName =
            document.getElementById("customNameInput").value || "PLAYER";
        }

        const settings = {
          playerName: finalName,
          showPlayCount: document.getElementById("showPlayCountCheckbox")
            .checked,
          style: document.querySelector('input[name="imageStyle"]:checked')
            .value,
        };

        editorModalOverlay.remove();
        resolve(settings);
      });

      editorModalOverlay.addEventListener("click", (e) => {
        if (e.target === editorModalOverlay) {
          editorModalOverlay.remove();
          reject(new Error("User cancelled"));
        }
      });
    });
  };

  const showResultModal = (imageBlob, dataUrl, averageRating, playerName) => {
    const resultModalOverlay = document.createElement("div");
    Object.assign(resultModalOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      zIndex: "10002",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      padding: "20px",
      boxSizing: "border-box",
      overflowY: "auto",
    });

    const modalContent = document.createElement("div");
    Object.assign(modalContent.style, {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "10px",
      width: "auto",
      maxWidth: "90%",
      textAlign: "center",
      boxShadow: "0 5px 15px rgba(0,0,0,0.5)",
    });

    const filename = `chunithm_best_rating_${playerName}_${new Date()
      .toISOString()
      .slice(0, 10)}.jpeg`;

    modalContent.innerHTML = `
      <h3 style="margin-top:0; margin-bottom:15px; font-size:20px; color:#333;">画像生成完了🎉</h3>
      <p style="font-size:16px; margin-bottom:10px; line-height:1.5;">
        画像は新しいタブで開かれました。
      </p>
      <div style="max-height: 50vh; overflow-y: auto; border: 1px solid #ccc; margin-bottom: 15px;">
        <img src="${dataUrl}" style="width: 100%; height: auto; display: block; max-width: 100%;">
      </div>
      <p style="font-size:14px; margin-bottom:15px; color:#666;">
        👆 上記画像を長押し、または以下のボタンで保存できます。
      </p>
      <div style="display: flex; justify-content: center;">
        <button id="downloadBtn"
           style="padding:10px 20px; border:none; border-radius:5px; background-color:#28a745; color:white; font-size:16px; font-weight:bold; cursor:pointer;">
          画像をダウンロード (${(imageBlob.size / 1024 / 1024).toFixed(2)}MB)
        </button>
      </div>
      <button id="closeBtn" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:5px; background-color:white; color:#333; font-size:16px; cursor:pointer; margin-top:15px;">閉じる</button>
    `;

    resultModalOverlay.appendChild(modalContent);
    document.body.appendChild(resultModalOverlay);

    document.getElementById("downloadBtn").addEventListener("click", () => {
      const url = URL.createObjectURL(imageBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    document.getElementById("closeBtn").addEventListener("click", () => {
      resultModalOverlay.remove();
    });

    resultModalOverlay.addEventListener("click", (e) => {
      if (e.target === resultModalOverlay) {
        resultModalOverlay.remove();
      }
    });
  };

  const generateImageWithCompression = async (
    container,
    playerName,
    initialQuality = 0.85
  ) => {
    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
    let currentQuality = initialQuality;
    let canvas = null;
    let blob = null;

    canvas = await html2canvas(container, {
      backgroundColor: "#1c1c1e",
      useCORS: true,
      allowTaint: true,
    });

    let attempt = 0;
    while (attempt < 10) {
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", currentQuality)
      );

      if (!blob || blob.size <= MAX_SIZE_BYTES) {
        break;
      }

      const sizeRatio = MAX_SIZE_BYTES / blob.size;
      currentQuality *= sizeRatio * 0.9;
      currentQuality = Math.max(0.1, currentQuality);
      attempt++;
    }

    if (!blob) throw new Error("画像ファイル生成に失敗しました。");

    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

    return { blob, dataUrl };
  };

  // === メイン処理 ===

  try {
    await showStartConfirmationModal();
  } catch (e) {
    if (e.message === "User cancelled") return;
    throw e;
  }

  loadGoogleFont("Orbitron", 900);

  const API_ENDPOINT =
    "https://runaaa0712.weblike.jp/api/chunithm/v1/const/query.php";
  const difficultyMap = {
    0: "BASIC",
    1: "ADVANCED",
    2: "EXPERT",
    3: "MASTER",
    4: "ULTIMA",
  };

  const progressModal = document.createElement("div");
  Object.assign(progressModal.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: "10000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#333",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  });
  const modalContent = document.createElement("div");
  Object.assign(modalContent.style, {
    backgroundColor: "white",
    padding: "30px 40px",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
  });
  const progressText = document.createElement("p");
  Object.assign(progressText.style, {
    fontSize: "18px",
    fontWeight: "bold",
    margin: "0 0 10px 0",
    lineHeight: "1.5",
  });
  const songTitleText = document.createElement("p");
  Object.assign(songTitleText.style, {
    fontSize: "16px",
    margin: "0",
    minHeight: "20px",
  });
  modalContent.appendChild(progressText);
  modalContent.appendChild(songTitleText);
  progressModal.appendChild(modalContent);
  document.body.appendChild(progressModal);

  try {
    progressText.innerText = "必要なページ情報を取得中...";
    songTitleText.innerText = "プレイヤー情報 / ベスト枠一覧";

    const [homeHtml, ratingHtml] = await Promise.all([
      fetch("https://new.chunithm-net.com/chuni-mobile/html/mobile/home/").then(
        (res) => res.text()
      ),
      fetch(
        "https://new.chunithm-net.com/chuni-mobile/html/mobile/home/playerData/ratingDetailBest/"
      ).then((res) => res.text()),
    ]);
    const parser = new DOMParser();
    let playerName = "プレイヤー情報なし";
    try {
      const homeDoc = parser.parseFromString(homeHtml, "text/html");
      const nameElement = homeDoc.querySelector(".player_name_in");
      if (nameElement) {
        playerName = nameElement.innerText.trim();
      }
    } catch (e) {
      console.error("プレイヤー名の取得に失敗:", e);
    }

    const ratingDoc = parser.parseFromString(ratingHtml, "text/html");
    const musicForms = Array.from(ratingDoc.querySelectorAll(".box05 > form"));
    if (musicForms.length === 0) {
      throw new Error(
        "レーティング対象曲が見つかりません。\nCHUNITHM-NETにログインしているか確認してください。"
      );
    }

    const collectedData = [];
    for (let i = 0; i < musicForms.length; i++) {
      const form = musicForms[i];
      const musicTitle = form.querySelector(".music_title").innerText.trim();

      progressText.innerHTML = `サーバー負荷低減のため待機時間（毎曲1.2秒）を設けています。しばらくお待ちください。<br>楽曲データを取得中... (${
        i + 1
      }/${musicForms.length})`;
      songTitleText.innerText = musicTitle;

      const scoreStr = form
        .querySelector(".play_musicdata_highscore .text_b")
        .innerText.trim();
      const scoreInt = parseInt(scoreStr.replace(/,/g, ""), 10);
      const diffValue = new FormData(form).get("diff");
      const difficultyString = difficultyMap[diffValue] || "UNKNOWN";
      let jacketUrl = "取得失敗",
        playCount = "取得失敗",
        musicConstant = "N/A",
        ratingValue = "---";

      try {
        const postBody = new URLSearchParams(new FormData(form)).toString();
        const response = await fetch(
          "https://new.chunithm-net.com/chuni-mobile/html/mobile/record/musicGenre/sendMusicDetail/",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: postBody,
          }
        );
        const detailHtml = await response.text();
        const detailDoc = new DOMParser().parseFromString(
          detailHtml,
          "text/html"
        );
        jacketUrl =
          detailDoc.querySelector(".play_jacket_img img")?.src || "取得失敗";
        let diffClass = "";
        switch (diffValue) {
          case "4":
            diffClass = ".bg_ultima";
            break;
          case "3":
            diffClass = ".bg_master";
            break;
          case "2":
            diffClass = ".bg_expert";
            break;
        }
        if (diffClass) {
          const targetBlock = detailDoc.querySelector(diffClass);
          if (targetBlock) {
            for (const titleElement of targetBlock.querySelectorAll(
              ".musicdata_score_title"
            )) {
              if (titleElement.innerText.includes("プレイ回数")) {
                playCount = titleElement.nextElementSibling.innerText.trim();
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error(`「${musicTitle}」の詳細取得エラー:`, e);
      }

      try {
        const apiResponse = await fetch(
          `${API_ENDPOINT}?song=${encodeURIComponent(
            musicTitle
          )}&difficulty=${difficultyString}`
        );
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          if (data && data["定数値"]) {
            musicConstant = data["定数値"];
            ratingValue = calculateRatingValue(
              scoreInt,
              parseFloat(musicConstant)
            );
          }
        }
      } catch (e) {
        console.error(`「${musicTitle}」のAPI通信エラー:`, e);
      }

      collectedData.push({
        title: musicTitle,
        score: scoreStr,
        jacketUrl,
        playCount,
        constant: musicConstant,
        ratingValue,
        diffValue,
      });
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    progressModal.style.display = "none";
    const userSettings = await showSettingsModal(playerName);
    playerName = userSettings.playerName;

    progressModal.style.display = "flex";
    progressText.innerText = "画像を生成中...";
    songTitleText.innerText = "しばらくお待ちください...";

    let totalRating = 0;
    let validRatingCount = 0;
    collectedData.forEach((song) => {
      const r = parseFloat(song.ratingValue);
      if (!isNaN(r)) {
        const valueForCalc = Math.floor(r * 100) / 100;
        totalRating += valueForCalc;
        validRatingCount++;
      }
    });
    const averageRating =
      validRatingCount > 0
        ? (totalRating / validRatingCount).toFixed(4)
        : "算出不可";

    const container = document.createElement("div");
    container.id = "chunithm-chart-container";
    Object.assign(container.style, {
      position: "absolute",
      left: "-9999px",
      top: "0",
      width: "1240px",
      backgroundColor: "#1c1c1e",
      zIndex: "-1",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      boxSizing: "border-box",
    });

    const topHeader = document.createElement("div");
    Object.assign(topHeader.style, {
      width: "100%",
      padding: "15px 25px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#2a2a2e",
      color: "white",
      boxSizing: "border-box",
    });
    topHeader.innerHTML = `<h1 style="margin:0; font-size:28px; font-weight:bold;">るなぁぁ版べ枠ジェネレーター</h1><p style="margin:0; font-size:16px; color:#aaa;">Creator：@RuuNaa00</p>`;
    container.appendChild(topHeader);

    const now = new Date();
    const timestamp = `${now.getFullYear()}/${String(
      now.getMonth() + 1
    ).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const playerInfoHeader = document.createElement("div");
    Object.assign(playerInfoHeader.style, {
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px",
      margin: "20px 0",
      boxSizing: "border-box",
    });
    playerInfoHeader.innerHTML = `<div><h2 style="color:#eee; margin:0 0 12px 0; font-size:32px; font-weight:bold;">Player: ${playerName}</h2><p style="color:#ffb84b; margin:0; font-size:24px; font-weight:bold;">BEST枠平均RATE: ${averageRating}</p></div><p style="color:#aaa; margin:0; font-size:16px;">Generated: ${timestamp}</p>`;
    container.appendChild(playerInfoHeader);

    const gridDiv = document.createElement("div");
    Object.assign(gridDiv.style, {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      width: "100%",
      padding: "0 10px",
      boxSizing: "border-box",
    });

    collectedData.forEach((song, index) => {
      const card = document.createElement("div");
      Object.assign(card.style, {
        width: "calc(20% - 20px)",
        margin: "10px",
        backgroundColor: "#222",
        color: "#eee",
        borderRadius: "8px",
        boxSizing: "border-box",
        textAlign: "center",
        position: "relative",
        border: "3px solid transparent",
      });
      const difficultyColors = { 2: "#e35454", 3: "#800080", 4: "#000000" };
      if (difficultyColors[song.diffValue])
        card.style.borderColor = difficultyColors[song.diffValue];

      const img = document.createElement("img");
      img.src = song.jacketUrl;
      Object.assign(img.style, {
        width: "100%",
        height: "auto",
        borderRadius: "4px 4px 0 0",
        borderBottom: "1px solid #444",
        display: "block",
      });

      const detailsContainer = document.createElement("div");
      Object.assign(detailsContainer.style, {
        position: "relative",
        padding: "8px 4px 4px 4px",
        overflow: "hidden",
      });

      detailsContainer.innerHTML = `<div style="position:absolute; right:-10px; bottom:-25px; font-size:80px; font-weight:900; font-family:Orbitron, sans-serif; color:rgba(255,255,255,0.1); z-index:0; line-height:1; user-select:none;">#${
        index + 1
      }</div>`;

      const textStyle = { position: "relative", zIndex: "1" };
      const titleP = document.createElement("p");
      titleP.innerText = song.title;

      const scoreValue = parseInt(song.score.replace(/,/g, ""), 10);
      let rank = "",
        rankColor = "#eee";
      if (scoreValue >= 1009000) {
        rank = "SSS+";
        rankColor = "#ffb84b";
      } else if (scoreValue >= 1007500) {
        rank = "SSS";
        rankColor = "#ffd700";
      } else if (scoreValue >= 1005000) {
        rank = "SS+";
        rankColor = "#f0f0f0";
      } else if (scoreValue >= 1000000) {
        rank = "SS";
        rankColor = "#e0e0e0";
      }

      const scoreP = document.createElement("p");
      scoreP.innerHTML = `スコア: ${song.score} <span style="color:${rankColor}; font-weight:bold;">${rank}</span>`;

      if (userSettings.style === "A") {
        Object.assign(titleP.style, textStyle, {
          fontWeight: "bold",
          fontSize: "14px",
          marginBottom: "4px",
          height: "3.2em",
          lineHeight: "1.6em",
          overflow: "hidden",
        });
        Object.assign(scoreP.style, textStyle, {
          fontSize: "13px",
          color: "#ccc",
          margin: "0 0 4px 0",
        });
        const constantP = document.createElement("p");
        constantP.innerText = `定数: ${song.constant}`;
        Object.assign(constantP.style, textStyle, {
          fontSize: "13px",
          color: "#aadeff",
          margin: "0 0 4px 0",
          fontWeight: "bold",
        });
        const ratingValueP = document.createElement("p");
        ratingValueP.innerText = `RATE: ${song.ratingValue}`;
        Object.assign(ratingValueP.style, textStyle, {
          fontSize: "14px",
          color: "#ffb84b",
          margin: "0 0 4px 0",
          fontWeight: "bold",
          border: "1px solid #555",
          borderRadius: "4px",
          padding: "2px 0",
          backgroundColor: "#333",
        });
        detailsContainer.appendChild(titleP);
        detailsContainer.appendChild(scoreP);
        detailsContainer.appendChild(constantP);
        detailsContainer.appendChild(ratingValueP);
      } else {
        Object.assign(titleP.style, textStyle, {
          fontWeight: "bold",
          fontSize: "16px",
          marginBottom: "4px",
          height: "1.6em",
          lineHeight: "1.6em",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        });
        Object.assign(scoreP.style, textStyle, {
          fontSize: "14px",
          color: "#ccc",
          margin: "0 0 4px 0",
        });
        const statsContainer = document.createElement("div");
        statsContainer.innerHTML = `<span style="font-size:13px; color:#aadeff; font-weight:bold; position:relative; z-index:1;">定数: ${song.constant}</span><span style="font-size:13px; color:#ccc; font-weight:bold;">&#9654;</span><span style="font-size:13px; color:#ffb84b; font-weight:bold; position:relative; z-index:1;">RATE: ${song.ratingValue}</span>`;
        Object.assign(statsContainer.style, {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          margin: "0 0 4px 0",
          border: "1px solid #555",
          borderRadius: "4px",
          padding: "2px 8px",
          backgroundColor: "#333",
        });
        detailsContainer.appendChild(titleP);
        detailsContainer.appendChild(scoreP);
        detailsContainer.appendChild(statsContainer);
      }

      if (userSettings.showPlayCount) {
        const playCountP = document.createElement("p");
        playCountP.innerText = `プレイ回数: ${song.playCount}`;
        Object.assign(playCountP.style, textStyle, {
          fontSize: "12px",
          color: "#888",
          margin: "0",
        });
        detailsContainer.appendChild(playCountP);
      }

      card.appendChild(img);
      card.appendChild(detailsContainer);
      gridDiv.appendChild(card);
    });
    container.appendChild(gridDiv);

    const footer = document.createElement("div");
    Object.assign(footer.style, {
      width: "100%",
      padding: "20px",
      marginTop: "20px",
      color: "#777",
      fontSize: "12px",
      textAlign: "center",
      boxSizing: "border-box",
      borderTop: "1px solid #444",
    });
    footer.innerHTML = `この画像はCHUNITHM-NETの表示内容を元に、ブックマークレットによって作成されました。<br>この画像は非公式ツールによって生成されたものであり、SEGA公式とは一切関係ありません。<br>楽曲ジャケット画像の著作権は、全て著作権所持者に帰属します。<br><br>本ページの情報はchunirecおよび<a href="https://chuni.kichi2004.jp/charts" target="_blank" rel="noopener noreferrer" style="color: #aadeff; text-decoration: none;">譜面定数メインフレーム</a>様のデータに基づきます。楽曲の定数は正確ではない場合があります。`;
    container.appendChild(footer);
    document.body.appendChild(container);

    const script = document.createElement("script");
    script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
    document.body.appendChild(script);

    script.onload = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const { blob, dataUrl } = await generateImageWithCompression(
          container,
          playerName
        );

        progressModal.remove();

        const newTab = window.open();
        if (newTab) {
          newTab.document.write(
            `<html><head><title>CHUNITHM Rating Chart</title><style>body{margin:0; background-color:black;}</style></head><body><img src="${dataUrl}" style="width:100%; max-width:100%; height:auto;"></body></html>`
          );
          newTab.document.close();
        }

        showResultModal(blob, dataUrl, averageRating, playerName);

        if (!newTab) {
          alert(
            "ポップアップがブロックされました。生成結果のモーダルから画像をダウンロードしてください。"
          );
        }
      } catch (e) {
        throw e;
      } finally {
        container.remove();
      }
    };
  } catch (e) {
    if (e.message !== "User cancelled") {
      alert("エラーが発生しました: " + e.message);
    }
    if (progressModal) progressModal.remove();
  }
})();
