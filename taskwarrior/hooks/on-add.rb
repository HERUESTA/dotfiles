#! /usr/bin/env ruby
require 'json'

task = JSON.parse($stdin.gets)
tags = task['tags'] || []

SORTED = %w[inbox next waiting someday].freeze
tags << 'inbox' if (tags & SORTED).empty?

task['tags'] = tags
puts JSON.generate(task)
puts 'inboxに入れました'
exit 0
