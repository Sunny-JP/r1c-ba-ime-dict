const GITHUB_OWNER = "Sunny-JP";
const GITHUB_REPO = "r1c-ba-ime-dict";
const BRANCH = "main";

document.addEventListener("DOMContentLoaded", () => {
  fetchHistory();
  document.getElementById("download-btn").addEventListener("click", generateDict);
});

async function fetchHistory() {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits`;

  try {
    const res = await fetch(url);
    const commits = await res.json();
    const list = document.getElementById("history-list");

    commits.forEach((c) => {
      const li = document.createElement("li");
      const date = new Date(c.commit.author.date).toLocaleDateString("ja-JP");
      li.textContent = `${date}: ${c.commit.message}`;
      list.appendChild(li);
    });
  } catch (e) {
    console.error("履歴の取得に失敗しました", e);
  }
}

async function generateDict() {
  const selected = Array.from(document.querySelectorAll(".category:checked")).map((cb) => cb.value);
  const ime = document.getElementById("ime-select").value;

  if (!selected.length) return alert("カテゴリを選択してください");

  let combined = [];

  for (const cat of selected) {
    const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/refs/heads/${BRANCH}/data/${cat}.csv`;
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      combined = combined.concat(parseCSV(text));
    }
  }

  downloadFile(formatDict(combined, ime), ime);
}

function parseCSV(text) {
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const [yomi, word, pos] = line.split(",");
      return {
        yomi: yomi?.trim(),
        word: word?.trim(),
        pos: pos?.trim() || "固有名詞",
      };
    })
    .filter((item) => item.yomi && item.word);
}

function formatDict(data, ime) {
  return data
    .map(({ yomi, word, pos }) => {
      if (ime === "apple") return `${word}\t${yomi}\t名詞`;
      return `${yomi}\t${word}\t${pos}`;
    })
    .join("\n");
}

function downloadFile(content, ime) {
  const isUtf16 = ime === "ms" || ime === "atok";
  let blob;

  if (isUtf16) {
    const buffer = new Uint16Array(content.length + 1);
    buffer[0] = 0xfeff;
    for (let i = 0; i < content.length; i++) {
      buffer[i + 1] = content.charCodeAt(i);
    }
    blob = new Blob([buffer], { type: "text/plain;charset=utf-16le" });
  } else {
    blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bluearchive_dict_${ime}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
