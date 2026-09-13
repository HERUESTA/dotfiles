#!/usr/bin/env ruby
# frozen_string_literal: true

require 'fileutils'
require 'open3'

# dotfiles 内の設定ファイルを、各ツールが読む場所へシンボリックリンクする。
# 何度実行しても同じ結果になり、既存のファイルは削除せずバックアップへ移してからリンクする。
#
# 使い方: ruby install.rb [--dry-run]
module Install
  DOTFILES = __dir__
  MIN_LAZYGIT_VERSION = Gem::Version.new('0.61.0') # prompts の condition が使える最小バージョン

  module_function

  # @param argv [Array<String>]
  # @return [Integer] 終了コード（error が 1 件でもあれば 1）
  def main(argv)
    dry_run = argv.include?('--dry-run')
    results = []

    if (config_dir = lazygit_config_dir)
      warn_if_old_lazygit
      results << link(File.join(DOTFILES, 'lazygit', 'config.yml'), File.join(config_dir, 'config.yml'), dry_run:)
    else
      warn 'warn:   lazygit が見つからないため lazygit の設定をスキップします（インストール後に再実行してください）'
    end

    results.include?(:error) ? 1 : 0
  end

  # lazygit が読む設定ディレクトリ。未インストールなら nil
  # OS や XDG_CONFIG_HOME による違いは lazygit 自身に判定させる。
  # @return [String, nil]
  def lazygit_config_dir
    dir = capture('lazygit', '--print-config-dir')
    dir unless dir.nil? || dir.empty?
  end

  # `lazygit --version` の出力から lazygit 自身のバージョンを取り出す
  # 出力には "git version=2.44.0" も含まれるため、行頭か ", " の直後の version= だけを見る。
  # @param output [String] 例: "commit=, build date=, build source=Homebrew, version=0.65.1, os=darwin, ..."
  # @return [Gem::Version, nil] 読み取れなければ nil
  def parse_lazygit_version(output)
    version = output[/(?:\A|, )version=(\d+(?:\.\d+)*)/, 1]
    version && Gem::Version.new(version)
  end

  # @param src [String] dotfiles 内の実体
  # @param dest [String] リンクを置く場所
  # @param dry_run [Boolean]
  # @return [Symbol] :skip / :link / :backup_and_link / :error
  def link(src, dest, dry_run:)
    unless File.exist?(src)
      warn "error:  リンク元がありません: #{src}"
      return :error
    end

    if same_entity?(src, dest)
      puts "skip:   #{dest}"
      return :skip
    end

    result = :link
    # File.exist? はリンクをたどるため、リンク切れは File.symlink? で拾う
    if File.exist?(dest) || File.symlink?(dest)
      backup = backup_path(dest)
      # シンボリックリンクの場合はリンク自体が移動し、リンク先の実体には触れない
      run("backup: #{dest} -> #{backup}", dry_run:) { FileUtils.mv(dest, backup) }
      result = :backup_and_link
    end

    run("link:   #{dest} -> #{src}", dry_run:) do
      FileUtils.mkdir_p(File.dirname(dest))
      File.symlink(src, dest)
    end
    result
  end

  # src と dest が実体として同じなら true
  # dest の親ディレクトリが dotfiles へのリンクになっている場合もここで検出する。
  # @return [Boolean] dest が存在しない、またはリンク切れなら false
  def same_entity?(src, dest)
    File.exist?(dest) && File.realpath(src) == File.realpath(dest)
  end

  # 既存のバックアップと衝突しないパスを返す（衝突したら -1, -2 … を付ける）
  # @param dest [String]
  # @param now [Time]
  # @return [String] 例: "config.yml.backup-20260914013000"
  def backup_path(dest, now: Time.now)
    base = "#{dest}.backup-#{now.strftime('%Y%m%d%H%M%S')}"
    path = base
    n = 0
    path = "#{base}-#{n += 1}" while File.exist?(path) || File.symlink?(path)
    path
  end

  def warn_if_old_lazygit
    version = parse_lazygit_version(capture('lazygit', '--version').to_s)
    if version.nil?
      warn 'warn:   lazygit のバージョンを読み取れませんでした'
    elsif version < MIN_LAZYGIT_VERSION
      warn "warn:   lazygit #{version} では gitmoji コミットの condition が無視されます（#{MIN_LAZYGIT_VERSION} 以上に更新してください）"
    end
  end

  def run(description, dry_run:)
    puts "#{'[dry-run] ' if dry_run}#{description}"
    yield unless dry_run
  end

  # @return [String, nil] 標準出力。コマンドが存在しないか失敗したら nil
  def capture(*command)
    output, status = Open3.capture2(*command)
    output.strip if status.success?
  rescue Errno::ENOENT
    nil
  end
end

exit Install.main(ARGV) if $PROGRAM_NAME == __FILE__
