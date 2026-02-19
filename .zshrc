export ZSH="$HOME/.oh-my-zsh"

ZSH_THEME="robbyrussell"

plugins=(git)

source $ZSH/oh-my-zsh.sh

. "$HOME/.local/bin/env"
export PATH="$(brew --prefix node@22)/bin:$PATH"
eval "$(starship init zsh)"
