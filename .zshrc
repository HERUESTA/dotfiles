export ZSH="$HOME/.oh-my-zsh"

export EDITOR="nvim"

ZSH_THEME="eastwood"

plugins=(
  git
  you-should-use
  docker
  docker-compose
  copyfile
)

function ghq-nvim() {
  local dir
  dir=$(ghq list -p | fzf --prompt='repo > ' --query "$LBUFFER") || return
  BUFFER="cd ${dir} && nvim ."
  zle accept-line
}
zle -N ghq-nvim
bindkey '^]' ghq-nvim

# リポジトリへ移動だけする
function ghq-cd() {
  local dir
  dir=$(ghq list -p | fzf --prompt='cd > ' --query "$LBUFFER") || return
  BUFFER="cd ${dir}"
  zle accept-line
}
zle -N ghq-cd
bindkey '^g' ghq-cd

source $ZSH/oh-my-zsh.sh

. "$HOME/.local/bin/env"
export PATH="$(brew --prefix node@22)/bin:$PATH"
export NODE_PATH="$(npm root -g)"

export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init - zsh)"

# コマンド履歴を１万行保存する
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt hist_ignore_dups  # 同じコマンドを履歴に残さない
setopt share_history     # 同時に起動したzshで履歴を共有する

# Ctrl + N/Pでコマンド履歴を検索する
autoload history-search-end
zle -N history-beginning-search-backward-end history-search-end
zle -N history-beginning-search-forward-end history-search-end
bindkey "^N" history-beginning-search-forward-end
bindkey "^P" history-beginning-search-backward-end

nvim ~/.zshrc

