// gtd: GTD 形式でワークスペースを並べる cmux のカスタムサイドバー
//
// 1ワークスペース = 1タスク。GTD の分類は description のタグで持つ:
//   @now / @next / @waiting / @someday / @done （タグなし = INBOX）
// タグを付けたカードは常にそのセクションに置く（入力待ちなどはカードの点の色と本文で示す）。
// タグなしのカードだけ、入力待ち・未読は INBOX、実行中・レビュー中は待ち、merge 済みは完了に自動で置く。
// PROJECTS はワークスペースグループ、進捗率はグループ内の完了の割合。
//
// リンク方法（dotfiles の中で実行）:
//   cmux/ ディレクトリごと ~/.config/cmux にリンクしているので、追加のリンクは不要。
//   ln -sfn "$(git rev-parse --show-toplevel)/cmux" ~/.config/cmux
// 表示する:
//   cmux sidebar validate gtd && cmux sidebar select gtd
//   （サイドバーの切り替えボタンを右クリックして gtd を選んでもよい）

// ---------------------------------------------------------------- 定数

const TAGS = ["@now", "@next", "@waiting", "@someday", "@done"];

const C = {
  inbox: "#F5A524",
  unseen: "#F2D24B",
  now: "#FF7A59",
  next: "#5AA9FF",
  waiting: "#4CC38A",
  review: "#B48CFF",
  idle: "#7D8491",
  branch: "#4CC38A",
  pr: "#B48CFF",
};

const SECTIONS = [
  { id: "inbox", label: "INBOX", color: C.inbox, foldable: false },
  { id: "next", label: "次に取るべき行動", color: C.next, foldable: false },
  { id: "waiting", label: "待ち", color: C.waiting, foldable: false },
  { id: "someday", label: "いつかやる・たぶんやる", color: C.idle, foldable: true },
  { id: "done", label: "完了", color: C.idle, foldable: true },
];

// ---------------------------------------------------------------- 状態

const [query, setQuery] = signal("");
const [groupFilter, setGroupFilter] = signal(null);
const [folded, setFolded] = signal({ someday: true, done: true });

const toggleFold = (id) => {
  const next = Object.assign({}, folded());
  next[id] = !next[id];
  setFolded(next);
};

const epoch = () => data.clock()?.epoch ?? 0;

// ---------------------------------------------------------------- ヘルパー

function fmt(secs) {
  const s = Math.max(0, Math.floor(secs));
  if (s < 60) return s + "s";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  return Math.floor(h / 24) + "d";
}

const descOf = (w) => String(w.description ?? "");
const tagOf = (w) => TAGS.find((t) => descOf(w).includes(t)) ?? null;
const stripTags = (text) =>
  TAGS.reduce((s, t) => s.split(t).join(""), String(text ?? "")).replace(/\s+/g, " ").trim();

const agentsOf = (w) => w.agents ?? [];
const needsInput = (w) =>
  agentsOf(w).some((a) => a.status === "needs_input") || w.status === "needs-attention";
const working = (w) => agentsOf(w).some((a) => a.status === "working") || w.status === "working";

// どの GTD 区分に置くか。手で付けたタグを常に優先し、
// タグがないときだけ cmux の状態から自動で振り分ける。
const BUCKET_OF_TAG = {
  "@now": "now", "@next": "next", "@waiting": "waiting", "@someday": "someday", "@done": "done",
};
function bucketOf(w) {
  const tag = tagOf(w);
  if (tag) return BUCKET_OF_TAG[tag];
  if (w.status === "done") return "done";
  if (needsInput(w) || w.unread > 0) return "inbox";
  if (working(w) || w.status === "review") return "waiting";
  return "inbox";
}

function dotOf(w) {
  if (needsInput(w)) return C.inbox;
  if (w.unread > 0) return C.unseen;
  if (working(w)) return C.waiting;
  if (w.status === "review") return C.review;
  const tag = tagOf(w);
  if (tag === "@next") return C.next;
  return C.idle;
}

function timeOf(w) {
  const live = agentsOf(w).find((a) => a.status === "needs_input" || a.status === "working");
  if (live && live.sinceEpoch) return fmt(epoch() - live.sinceEpoch);
  if (w.latestAt) return fmt(epoch() - w.latestAt);
  return "";
}

function messageOf(w) {
  if (needsInput(w)) return "入力待ち：" + (w.latestMessage ?? "確認してください");
  if (w.unread > 0) return "完了（未確認）：" + (w.latestMessage ?? "");
  const note = stripTags(descOf(w));
  if (note) return note;
  if (working(w)) return "エージェント実行中" + (w.latestMessage ? "：" + w.latestMessage : "");
  if (w.status === "review") return "レビュー待ち";
  if (!tagOf(w)) return "未整理：右クリックで振り分け";
  return w.latestPrompt ?? "";
}

const groupById = (id) => (data.groups() ?? []).find((g) => g.id === id) ?? null;

function chipsOf(w) {
  const chips = [];
  const g = w.group ? groupById(w.group) : null;
  if (g) chips.push({ key: "g", text: g.name, color: g.color ?? C.next });
  if (w.branch) chips.push({ key: "b", text: "⑂ " + w.branch + (w.dirty ? " ●" : ""), color: C.branch });
  if (w.pr) chips.push({ key: "p", text: "#" + w.pr.number, color: C.pr });
  return chips;
}

// description のタグだけを差し替える（メモ部分は残す）
function setTag(w, tag) {
  const note = stripTags(descOf(w));
  const description = (tag ? tag + " " : "") + note;
  cmux("workspace.action", {
    action: "set_description",
    workspace_id: w.id,
    description: description.trim(),
  });
}

const select = (w) => cmux("workspace.select", { workspace_id: w.id });

function taskMenu(w) {
  return [
    Button("今すぐやる", () => setTag(w(), "@now")),
    Button("次に取るべき行動", () => setTag(w(), "@next")),
    Button("待ち", () => setTag(w(), "@waiting")),
    Button("いつかやる・たぶんやる", () => setTag(w(), "@someday")),
    Divider(),
    Button("完了", () => setTag(w(), "@done")),
    Button("INBOX に戻す", () => setTag(w(), null)),
  ];
}

// ---------------------------------------------------------------- データ

const visible = computed(() => {
  const q = query().trim().toLowerCase();
  const gf = groupFilter();
  return (data.workspaces() ?? []).filter((w) => {
    if (gf && w.group !== gf) return false;
    if (!q) return true;
    const hay = [w.title, w.description, w.branch, w.latestMessage, w.latestPrompt]
      .map((s) => String(s ?? "").toLowerCase())
      .join(" ");
    return hay.includes(q);
  });
});

const buckets = computed(() => {
  const out = { now: [], inbox: [], next: [], waiting: [], someday: [], done: [] };
  for (const w of visible()) out[bucketOf(w)].push(w);
  // 入力待ちを INBOX の先頭に
  out.inbox.sort((a, b) => (needsInput(b) ? 1 : 0) - (needsInput(a) ? 1 : 0));
  return out;
});

const nowTask = computed(() => buckets().now[0] ?? null);

// セクション見出し・カード・サブエージェントを1本の平らなリストにする
const entries = computed(() => {
  const b = buckets();
  const f = folded();
  const out = [];
  for (const s of SECTIONS) {
    const items = b[s.id];
    if (items.length === 0 && s.id !== "inbox") continue;
    out.push({ key: "h:" + s.id, kind: "header", section: s, count: items.length });
    if (s.foldable && f[s.id]) continue;
    if (items.length === 0) {
      out.push({ key: "e:" + s.id, kind: "empty", text: "Inbox ゼロ。すっきり。" });
      continue;
    }
    for (const w of items.slice(0, 20)) {
      out.push({ key: "w:" + w.id, kind: "card", w, highlight: needsInput(w) });
      for (const a of agentsOf(w)) {
        for (const c of (a.children ?? []).filter((c) => c.running)) {
          out.push({ key: "c:" + w.id + ":" + c.id, kind: "child", w, c });
        }
      }
    }
  }
  return out;
});

const projects = computed(() =>
  (data.groups() ?? [])
    .map((g) => {
      const members = (data.workspaces() ?? []).filter((w) => w.group === g.id);
      const done = members.filter((w) => bucketOf(w) === "done").length;
      const next =
        members.find((w) => bucketOf(w) === "now") ?? members.find((w) => bucketOf(w) === "next");
      return {
        key: g.id,
        name: g.name,
        color: g.color ?? C.next,
        total: members.length,
        ratio: members.length ? done / members.length : 0,
        next: next ? next.title : "—",
      };
    })
    .filter((p) => p.total > 0)
);

const totals = computed(() => {
  const all = data.workspaces() ?? [];
  const done = all.filter((w) => bucketOf(w) === "done").length;
  return { done, total: all.length };
});

// ---------------------------------------------------------------- 部品

// "#RRGGBB" に透明度を足す（それ以外の色指定はそのまま薄いグレーにする）
const tint = (color, alpha) =>
  /^#[0-9a-fA-F]{6}$/.test(String(color)) ? color + alpha : "#7f7f7f" + alpha;

function chip(text, color) {
  return Text(text)
    .font(10).weight("medium").color(color)
    .lineLimit(1).truncation("tail")
    .paddingHorizontal(6).paddingVertical(2)
    .background(tint(color, "26"))
    .cornerRadius(4);
}

function countDot(color, count) {
  return HStack({ spacing: 4 }, [
    Circle({ size: 7 }).fill(color),
    Text(() => String(count())).font(11).monospaced().color("secondary"),
  ]);
}

function headerRow(e) {
  const s = e().section;
  return HStack({ spacing: 6 }, [
    Text(s.label).font(11).weight("bold").color(s.color),
    Text(() => String(e().count)).font(11).color("secondary"),
    Spacer(),
    Image("chevron.right")
      .font(9).color("tertiary")
      .rotation(() => (s.foldable && folded()[s.id] ? 0 : 90))
      .frame({ width: 14, height: 14 }),
  ])
    .paddingHorizontal(8).paddingVertical(4)
    .frame({ maxWidth: "infinity" })
    .cursor("pointer")
    .onTap(() => { if (s.foldable) toggleFold(s.id); });
}

function cardRow(e) {
  const w = () => e().w;
  return VStack({ spacing: 5 }, [
    HStack({ spacing: 7 }, [
      Circle({ size: 7 }).fill(() => dotOf(w())),
      Text(() => w().title)
        .font(13).weight("semibold")
        .lineLimit(1).truncation("tail").marquee(),
      Spacer({ minLength: 0 }),
      Text(() => timeOf(w())).font(10).monospaced().color("tertiary").layoutPriority(2),
    ]),
    HStack({ spacing: 4 }, [
      ForEach({ items: () => chipsOf(w()), key: (c) => c.key }, (c) =>
        chip(() => c().text, c().color)),
      Spacer({ minLength: 0 }),
    ]).paddingHorizontal(14),
    Text(() => messageOf(w()))
      .font(11.5)
      .color(() => (e().highlight ? C.inbox : "secondary"))
      .lineLimit(2).truncation("tail")
      .paddingHorizontal(14),
  ])
    .padding(9)
    .frame({ maxWidth: "infinity" })
    .background(() => (e().highlight ? C.inbox + "26" : w().selected ? "#7f7f7f33" : "#7f7f7f1a"))
    .hoverBackground("#7f7f7f2e")
    .cornerRadius(9)
    .cursor("pointer")
    .onTap(() => select(w()))
    .contextMenu(taskMenu(w));
}

function childRow(e) {
  return HStack({ spacing: 7 }, [
    Text("└").font(11).monospaced().color("tertiary"),
    Circle({ size: 5 }).fill(C.waiting),
    Text(() => e().c.label ?? "subagent").font(11.5).color("secondary").lineLimit(1).truncation("tail"),
    Spacer({ minLength: 0 }),
    Text(() => fmt(epoch() - (e().c.startedEpoch ?? epoch()))).font(10).monospaced().color("tertiary"),
  ]).paddingHorizontal(22).paddingVertical(1);
}

function emptyRow(e) {
  return Text(() => e().text).font(11).color("tertiary").paddingHorizontal(10).paddingVertical(4);
}

function nowCard() {
  const w = () => nowTask();
  const has = () => w() !== null;
  return VStack({ spacing: 7 }, [
    HStack({ spacing: 6 }, [
      Text(() => (has() ? "今すぐやる" : "")).font(11).weight("bold").color(C.now),
      Spacer(),
      Text(() => (has() ? timeOf(w()) : "")).font(10).monospaced().color(C.now),
    ]),
    Text(() => (has() ? w().title : ""))
      .font(15).weight("bold").lineLimit(2).truncation("tail"),
    Text(() => (has() ? messageOf(w()) : ""))
      .font(11.5).color("secondary").lineLimit(2).truncation("tail"),
    HStack({ spacing: 6 }, [
      Text(() => (has() ? "中断" : ""))
        .font(12).weight("semibold").color(C.now)
        .frame({ maxWidth: "infinity" }).paddingVertical(() => (has() ? 5 : 0))
        .background(() => (has() ? C.now + "26" : null)).cornerRadius(6)
        .cursor("pointer")
        .onTap(() => { if (has()) setTag(w(), "@next"); }),
      Text(() => (has() ? "完了" : ""))
        .font(12).weight("semibold").color("#1A1C21")
        .frame({ maxWidth: "infinity" }).paddingVertical(() => (has() ? 5 : 0))
        .background(() => (has() ? C.now : null)).cornerRadius(6)
        .cursor("pointer")
        .onTap(() => { if (has()) setTag(w(), "@done"); }),
    ]),
  ])
    .padding(() => (has() ? 11 : 0))
    .frame({ maxWidth: "infinity" })
    .background(() => (has() ? tint(C.now, "24") : null))
    .borderColor(() => (has() ? C.now + "66" : "#00000000"))
    .borderWidth(1)
    .cornerRadius(10)
    .onTap(() => { if (has()) select(w()); });
}

function projectRow(p) {
  return VStack({ spacing: 5 }, [
    HStack({ spacing: 7 }, [
      RoundedRectangle({ width: 7, height: 7, cornerRadius: 2 }).fill(() => p().color),
      Text(() => p().name).font(12.5).weight("semibold").lineLimit(1).truncation("tail"),
      Spacer({ minLength: 0 }),
      Text(() => Math.round(p().ratio * 100) + "%").font(10).monospaced().color("secondary"),
    ]),
    ProgressView({ value: () => p().ratio }).paddingHorizontal(14),
    Text(() => "次：" + p().next).font(11).color("secondary").lineLimit(1).truncation("tail")
      .paddingHorizontal(14),
  ])
    .padding(9)
    .frame({ maxWidth: "infinity" })
    .background("#7f7f7f1a")
    .cornerRadius(9)
    .cursor("pointer")
    .onTap(() => setGroupFilter(p().key));
}

function filterChip(label, active, onTap) {
  return Text(label)
    .font(12).weight("semibold")
    .color(() => (active() ? "primary" : "secondary"))
    .paddingHorizontal(9).paddingVertical(4)
    .background(() => (active() ? "#7f7f7f33" : null))
    .cornerRadius(6)
    .cursor("pointer")
    .onTap(onTap);
}

// ---------------------------------------------------------------- 本体

sidebar(() =>
  VStack({ spacing: 10 }, [
      HStack({ spacing: 8 }, [
        Image("checkmark.square").font(14).color(C.next),
        Text("タスク管理").font(15).weight("bold"),
        Spacer(),
        countDot(C.inbox, () => buckets().inbox.length),
        countDot(C.next, () => buckets().next.length),
        countDot(C.waiting, () => buckets().waiting.length),
        countDot(C.idle, () => buckets().done.length),
      ]).paddingHorizontal(6),

      HStack({ spacing: 4 }, [
        filterChip("すべて", () => groupFilter() === null, () => setGroupFilter(null)),
        ForEach({ items: () => (data.groups() ?? []).slice(0, 4), key: (g) => g.id }, (g) =>
          filterChip(() => g().name, () => groupFilter() === g().id, () => setGroupFilter(g().id))),
        Spacer({ minLength: 0 }),
      ]).paddingHorizontal(4),

      TextField("", {
        placeholder: "タスクを検索…",
        autofocus: false,
        onEdit: (t) => setQuery(t ?? ""),
        onSubmit: (t) => setQuery(t ?? ""),
      }).paddingHorizontal(4),

      Divider(),

      nowCard(),

      ForEach({ items: entries, key: (e) => e.key }, (e) => {
        const kind = e().kind; // key ごとに kind は固定
        if (kind === "header") return headerRow(e);
        if (kind === "child") return childRow(e);
        if (kind === "empty") return emptyRow(e);
        return cardRow(e);
      }),

      Text(() => (projects().length ? "PROJECTS" : ""))
        .font(11).weight("bold").color("secondary").paddingHorizontal(8),
      ForEach({ items: projects, key: (p) => p.key }, (p) => projectRow(p)),

      VStack({ spacing: 6 }, [
        HStack({}, [
          Text("進捗").font(11).weight("bold").color("secondary"),
          Spacer(),
          Text(() => "完了 " + totals().done + " / " + totals().total)
            .font(10).monospaced().color("secondary"),
        ]),
        ProgressView({ value: () => (totals().total ? totals().done / totals().total : 0) }),
        Text("右クリックで振り分け。Claude に「完了」と言っても更新できます")
          .font(10.5).color("tertiary").lineLimit(2),
      ])
        .padding(10)
        .background("#7f7f7f1a")
        .cornerRadius(9),
  ]).paddingHorizontal(8).paddingVertical(10),
  { surface: "glass" }
)
