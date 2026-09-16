SLOWLOG=/var/log/mysql/mysql-slow.log

slowlog-on() {
  sudo mysql -e "SET GLOBAL slow_query_log = 1; SET GLOBAL long_query_time = 0;"
  sudo systemctl restart isu-ruby 2>/dev/null
}

slowlog-off() {
  sudo mysql -e "SET GLOBAL slow_query_log = 0;"
}
