// gtd: ワークスペースを TODO / DOING / DONE に並べる cmux のカスタムサイドバー（.swift 版）
//
// gtd.js と同じ内容を、.js に対応していない cmux でも動く形式で書いたもの。
// 両方あるときは cmux が .js を優先するので、.js 対応版になれば自動で切り替わる。
// .swift 版は状態を持てないため、検索欄・セクションの開閉・グループでの絞り込み・
// ドラッグでの振り分け・名前の変更はない。
//
// 1ワークスペース = 1タスク。分類は description のタグで持つ:
//   @todo / @doing / @done
//   （以前のタグも読む: @next・@someday は TODO、@now・@waiting は DOING）
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

// どのセクションに置くか。手で付けたタグを常に優先し、タグがないときだけ cmux の状態から自動で振り分ける。
func bucketOf(_ w) -> String {
  if hasTag(w, "@todo") { return "todo" }
  if hasTag(w, "@doing") { return "doing" }
  if hasTag(w, "@done") { return "done" }
  if hasTag(w, "@now") || hasTag(w, "@waiting") { return "doing" }
  if hasTag(w, "@next") || hasTag(w, "@someday") { return "todo" }
  if w.status == "done" { return "done" }
  if needsInput(w) || w.unread > 0 || isWorking(w) || w.status == "review" { return "doing" }
  return "todo"
}

func dotOf(_ w) -> String {
  if needsInput(w) { return "#F5A524" }
  if w.unread > 0 { return "#F2D24B" }
  if isWorking(w) { return "#4CC38A" }
  if w.status == "review" { return "#B48CFF" }
  if bucketOf(w) == "todo" { return "#5AA9FF" }
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
    Button("TODO") { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "@todo")) }
    Button("DOING") { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "@doing")) }
    Button("DONE") { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "@done")) }
    Divider()
    Button("タグを外して自動で振り分ける") { cmux("workspace.action", action: "set_description", workspace_id: w.id, description: withTag(w, "")) }
  }
}

// ---------------------------------------------------------------- 本体

VStack(alignment: .leading, spacing: 10) {
  let all = workspaces.prefix(80)
  let now = clock.epoch
  let todo = all.filter { bucketOf($0) == "todo" }
  let doing = all.filter { bucketOf($0) == "doing" }.sorted { (needsInput($0) ? 1 : 0) > (needsInput($1) ? 1 : 0) }
  let done = all.filter { bucketOf($0) == "done" }

  HStack(spacing: 8) {
    Image(systemName: "checkmark.square").font(.system(size: 14)).foregroundColor("#5AA9FF")
    Text("タスク管理").font(.system(size: 15)).bold()
    Spacer()
    countDot("#5AA9FF", todo.count)
    countDot("#FF7A59", doing.count)
    countDot("#7D8491", done.count)
  }
  .padding(.horizontal, 6)
  Divider()

  sectionHeader("TODO", todo.count, "#5AA9FF")
  if todo.count == 0 {
    Text("TODO はありません").font(.system(size: 11)).foregroundColor(.tertiary).padding(.horizontal, 10)
  }
  ForEach(todo.prefix(20)) { w in card(w, now) }

  sectionHeader("DOING", doing.count, "#FF7A59")
  if doing.count == 0 {
    Text("進行中のタスクはありません").font(.system(size: 11)).foregroundColor(.tertiary).padding(.horizontal, 10)
  }
  ForEach(doing.prefix(20)) { w in card(w, now) }

  if done.count > 0 {
    sectionHeader("DONE", done.count, "#7D8491")
    ForEach(done.prefix(3)) { w in card(w, now).opacity(0.45) }
  }

  VStack(alignment: .leading, spacing: 6) {
    HStack {
      Text("進捗").font(.system(size: 11)).fontWeight(.bold).foregroundColor(.secondary)
      Spacer()
      Text("DONE \(done.count) / \(all.count)").font(.system(size: 10, design: .monospaced)).foregroundColor(.secondary)
    }
    ProgressView(value: all.count > 0 ? Double(done.count) / Double(all.count) : 0.0, total: 1.0).tint("#4CC38A")
    Text("右クリックで振り分け。Claude に頼んでも更新できます")
      .font(.system(size: 10.5)).foregroundColor(.tertiary).lineLimit(2)
  }
  .padding(10)
  .background { RoundedRectangle(cornerRadius: 9).foregroundColor("#7F7F7F").opacity(0.1) }

  Spacer()
}
.padding(8)
