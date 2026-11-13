// gtd: GTD 形式でワークスペースを並べる cmux のカスタムサイドバー（.swift 版）
//
// gtd.js と同じ内容を、.js に対応していない cmux でも動く形式で書いたもの。
// 両方あるときは cmux が .js を優先するので、.js 対応版になれば自動で切り替わる。
// .swift 版は状態を持てないため、検索欄・セクションの開閉・グループでの絞り込みはない。
//
// 1ワークスペース = 1タスク。GTD の分類は description のタグで持つ:
//   @now / @next / @waiting / @someday / @done （タグなし = INBOX）
//
// リンク方法（dotfiles の中で実行）:
//   cmux/ ディレクトリごと ~/.config/cmux にリンクしているので、追加のリンクは不要。
//   ln -sfn "$(git rev-parse --show-toplevel)/cmux" ~/.config/cmux
// 表示する:
//   cmux sidebar validate gtd && cmux sidebar select gtd

// ---------------------------------------------------------------- 判定

func descOf(_ w) -> String {
  return w.description != nil ? w.description : ""
}

func hasTag(_ w, _ tag) -> Bool {
  return descOf(w).contains(tag)
}

func isTagged(_ w) -> Bool {
  return hasTag(w, "@now") || hasTag(w, "@next") || hasTag(w, "@waiting") || hasTag(w, "@someday") || hasTag(w, "@done")
}

// タグ以外のメモ部分
func noteOf(_ w) -> String {
  return descOf(w).split(separator: " ").filter { !$0.hasPrefix("@") }.reduce("") { $0 == "" ? $1 : "\($0) \($1)" }
}

func agentCount(_ w, _ status) -> Int {
  if w.agents == nil { return 0 }
  return w.agents.filter { $0.status == status }.count
}

func needsInput(_ w) -> Bool {
  return agentCount(w, "needs_input") > 0 || w.status == "needs-attention"
}

func isWorking(_ w) -> Bool {
  return agentCount(w, "working") > 0 || w.status == "working"
}

// どの GTD 区分に置くか。手で付けたタグを常に優先し、タグがないときだけ cmux の状態から自動で振り分ける。
func bucketOf(_ w) -> String {
  if hasTag(w, "@now") { return "now" }
  if hasTag(w, "@next") { return "next" }
  if hasTag(w, "@waiting") { return "waiting" }
  if hasTag(w, "@someday") { return "someday" }
  if hasTag(w, "@done") { return "done" }
  if w.status == "done" { return "done" }
  if needsInput(w) || w.unread > 0 { return "inbox" }
  if isWorking(w) || w.status == "review" { return "waiting" }
  return "inbox"
}

func dotOf(_ w) -> String {
  if needsInput(w) { return "#F5A524" }
  if w.unread > 0 { return "#F2D24B" }
  if isWorking(w) { return "#4CC38A" }
  if w.status == "review" { return "#B48CFF" }
  if hasTag(w, "@next") { return "#5AA9FF" }
  return "#7D8491"
}

func agoLabel(_ secs) -> String {
  if secs < 60 { return "\(secs)s" }
  if secs < 3600 { return "\(secs / 60)m" }
  if secs < 86400 { return "\(secs / 3600)h" }
  return "\(secs / 86400)d"
}

func sinceOf(_ w) -> Int {
  if w.agents != nil {
    let live = w.agents.filter { ($0.status == "needs_input" || $0.status == "working") && $0.sinceEpoch != nil }
    if live.count > 0 { return live.first.sinceEpoch }
  }
  if w.latestAt != nil { return w.latestAt }
  return 0
}

func timeOf(_ w, _ now) -> String {
  let since = sinceOf(w)
  return since > 0 ? agoLabel(now - since) : ""
}

func messageOf(_ w) -> String {
  if needsInput(w) { return w.latestMessage != nil ? "入力待ち：\(w.latestMessage)" : "入力待ち" }
  if w.unread > 0 { return w.latestMessage != nil ? "完了（未確認）：\(w.latestMessage)" : "完了（未確認）" }
  let note = noteOf(w)
  if note != "" { return note }
  if isWorking(w) { return "エージェント実行中" }
  if w.status == "review" { return "レビュー待ち" }
  if !isTagged(w) { return "未整理：右クリックで振り分け" }
  return w.latestPrompt != nil ? w.latestPrompt : ""
}

func withTag(_ w, _ tag) -> String {
  let note = noteOf(w)
  if tag == "" { return note }
  return note == "" ? tag : "\(tag) \(note)"
}

// ---------------------------------------------------------------- 部品

func chip(_ text, _ color) -> some View {
  Text(text)
    .font(.system(size: 10)).fontWeight(.medium)
    .foregroundColor(color)
    .lineLimit(1).truncationMode(.tail)
    .padding(.horizontal, 6).padding(.vertical, 2)
    .background { RoundedRectangle(cornerRadius: 4).foregroundColor(color).opacity(0.16) }
}

func countDot(_ color, _ count) -> some View {
  HStack(spacing: 4) {
    Circle().frame(width: 7, height: 7).foregroundColor(color)
    Text("\(count)").font(.system(size: 11, design: .monospaced)).foregroundColor(.secondary)
  }
}

func sectionHeader(_ name, _ count, _ tint) -> some View {
  HStack(spacing: 6) {
    Text(name).font(.system(size: 11)).fontWeight(.bold).foregroundColor(tint)
    Text("\(count)").font(.system(size: 11)).foregroundColor(.secondary)
    Spacer()
  }
  .padding(.horizontal, 8).padding(.top, 4)
}

func card(_ w, _ now) -> some View {
  Button(action: { cmux("workspace.select", workspace_id: w.id) }) {
    VStack(alignment: .leading, spacing: 5) {
      HStack(spacing: 7) {
        Circle().frame(width: 7, height: 7).foregroundColor(dotOf(w))
        Text(w.title).font(.system(size: 13)).fontWeight(.semibold).lineLimit(1).truncationMode(.tail)
        Spacer()
        Text(timeOf(w, now)).font(.system(size: 10, design: .monospaced)).foregroundColor(.tertiary)
      }
      HStack(spacing: 4) {
        if w.branch != nil && w.branch != "" {
          chip(w.dirty == true ? "⑂ \(w.branch) ●" : "⑂ \(w.branch)", "#4CC38A")
        }
        if w.pr != nil {
          chip("#\(w.pr.number)", "#B48CFF")
        }
        Spacer()
      }
      .padding(.leading, 14)
      Text(messageOf(w))
        .font(.system(size: 11.5))
        .foregroundColor(needsInput(w) ? "#F5A524" : .secondary)
        .lineLimit(2).truncationMode(.tail)
        .padding(.leading, 14)
    }
    .padding(9)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background {
      RoundedRectangle(cornerRadius: 9)
        .foregroundColor(needsInput(w) ? "#F5A524" : "#7F7F7F")
        .opacity(needsInput(w) ? 0.16 : (w.selected ? 0.2 : 0.1))
    }
  }
  .contextMenu {
    Button("今すぐやる") { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "@now")) }
    Button("次に取るべき行動") { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "@next")) }
    Button("待ち") { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "@waiting")) }
    Button("いつかやる・たぶんやる") { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "@someday")) }
    Divider()
    Button("完了") { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "@done")) }
    Button("INBOX に戻す") { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "")) }
  }
}

func nowCard(_ w, _ now) -> some View {
  VStack(alignment: .leading, spacing: 7) {
    HStack {
      Text("今すぐやる").font(.system(size: 11)).fontWeight(.bold).foregroundColor("#FF7A59")
      Spacer()
      Text(timeOf(w, now)).font(.system(size: 10, design: .monospaced)).foregroundColor("#FF7A59")
    }
    Button(action: { cmux("workspace.select", workspace_id: w.id) }) {
      Text(w.title).font(.system(size: 15)).fontWeight(.bold).lineLimit(2)
    }
    Text(messageOf(w)).font(.system(size: 11.5)).foregroundColor(.secondary).lineLimit(2)
    HStack(spacing: 6) {
      Button(action: { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "@next")) }) {
        Text("中断").font(.system(size: 12)).fontWeight(.semibold).foregroundColor("#FF7A59")
          .frame(maxWidth: .infinity).padding(.vertical, 5)
          .background { RoundedRectangle(cornerRadius: 6).foregroundColor("#FF7A59").opacity(0.16) }
      }
      Button(action: { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "@done")) }) {
        Text("完了").font(.system(size: 12)).fontWeight(.semibold).foregroundColor("#1A1C21")
          .frame(maxWidth: .infinity).padding(.vertical, 5)
          .background { RoundedRectangle(cornerRadius: 6).foregroundColor("#FF7A59") }
      }
    }
  }
  .padding(11)
  .frame(maxWidth: .infinity, alignment: .leading)
  .background { RoundedRectangle(cornerRadius: 10).foregroundColor("#FF7A59").opacity(0.14) }
}

// ---------------------------------------------------------------- 本体

VStack(alignment: .leading, spacing: 10) {
  let all = workspaces.prefix(80)
  let now = clock.epoch
  let nowTasks = all.filter { bucketOf($0) == "now" }
  let inbox = all.filter { bucketOf($0) == "inbox" }.sorted { (needsInput($0) ? 1 : 0) > (needsInput($1) ? 1 : 0) }
  let next = all.filter { bucketOf($0) == "next" }
  let waiting = all.filter { bucketOf($0) == "waiting" }
  let someday = all.filter { bucketOf($0) == "someday" }
  let done = all.filter { bucketOf($0) == "done" }

  HStack(spacing: 8) {
    Image(systemName: "checkmark.square").font(.system(size: 14)).foregroundColor("#5AA9FF")
    Text("タスク管理").font(.system(size: 15)).bold()
    Spacer()
    countDot("#F5A524", inbox.count)
    countDot("#5AA9FF", next.count)
    countDot("#4CC38A", waiting.count)
    countDot("#7D8491", done.count)
  }
  .padding(.horizontal, 6)
  Divider()

  if nowTasks.count > 0 {
    nowCard(nowTasks.first, now)
  }

  sectionHeader("INBOX", inbox.count, "#F5A524")
  if inbox.count == 0 {
    Text("Inbox ゼロ。すっきり。").font(.system(size: 11)).foregroundColor(.tertiary).padding(.horizontal, 10)
  }
  ForEach(inbox.prefix(20)) { w in card(w, now) }

  if next.count > 0 {
    sectionHeader("次に取るべき行動", next.count, "#5AA9FF")
    ForEach(next.prefix(20)) { w in card(w, now) }
  }

  if waiting.count > 0 {
    sectionHeader("待ち", waiting.count, "#4CC38A")
    ForEach(waiting.prefix(20)) { w in card(w, now) }
  }

  if someday.count > 0 {
    sectionHeader("いつかやる・たぶんやる", someday.count, "#7D8491")
    ForEach(someday.prefix(5)) { w in card(w, now).opacity(0.6) }
  }

  if done.count > 0 {
    sectionHeader("完了", done.count, "#7D8491")
    ForEach(done.prefix(3)) { w in card(w, now).opacity(0.45) }
  }

  VStack(alignment: .leading, spacing: 6) {
    HStack {
      Text("進捗").font(.system(size: 11)).fontWeight(.bold).foregroundColor(.secondary)
      Spacer()
      Text("完了 \(done.count) / \(all.count)").font(.system(size: 10, design: .monospaced)).foregroundColor(.secondary)
    }
    ProgressView(value: all.count > 0 ? Double(done.count) / Double(all.count) : 0.0, total: 1.0).tint("#4CC38A")
    Text("右クリックで振り分け。Claude に「完了」と言っても更新できます")
      .font(.system(size: 10.5)).foregroundColor(.tertiary).lineLimit(2)
  }
  .padding(10)
  .background { RoundedRectangle(cornerRadius: 9).foregroundColor("#7F7F7F").opacity(0.1) }

  Spacer()
}
.padding(8)
