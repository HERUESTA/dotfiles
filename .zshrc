export ZSH="$HOME/.oh-my-zsh"

ZSH_THEME="eastwood"

plugins=(
  git
  you-should-use
  docker
  docker-compose
  copyfile
)

cd_git_repo() {
  local selected="$(ghq list | fzf)"

  if [[ -n "$selected" ]]; then
    cd "$(ghq root)/$selected"
  fi
}

fbrr() {
  local branches branch
  branches=$(git branch --all | grep -v HEAD) &&
  branch=$(echo "$branches" |
           fzf-tmux -d $(( 2 + $(wc -l <<< "$branches") )) +m) &&
  git checkout $(echo "$branch" | sed "s/.* //" | sed "s#remotes/[^/]*/##")
}

source $ZSH/oh-my-zsh.sh

. "$HOME/.local/bin/env"
export PATH="$(brew --prefix node@22)/bin:$PATH"

// 不要なローカルブランチを削除するgitのエイリアス
git config --global alias.pd '!git fetch --prune && git branch -vv | grep ": gone]" | awk "{print \$1}" | xargs git branch -D'

