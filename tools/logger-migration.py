#!/usr/bin/env python3
"""
Logger Enterprise Migration Tool v1.0.0
Automatiza migracao de console.* para Logger Enterprise

Uso:
  python3 logger-migration.py --scan
  python3 logger-migration.py --migrate --limit 20
  python3 logger-migration.py --migrate --dry-run
"""

import os
import re
import sys
import subprocess
import shutil
from datetime import datetime
import argparse

CONFIG = {
    'base_path': '/var/www/dshowdash/public/components',
    'backup_path': '/backup',
    'logger_import': "import { Logger } from '/assets/js/core/logger-global/index.js';",
    'excluded_dirs': ['node_modules', '.git', 'vendor', 'dist'],
    'excluded_files': ['logger-global', 'index.min.js'],
}

LOG_OBJECT = """const log = {
  info: (msg, ctx = {}) => Logger.info(msg, { component: MODULE_ID, ...ctx }),
  warn: (msg, ctx = {}) => Logger.warn(msg, { component: MODULE_ID, ...ctx }),
  error: (msg, ctx = {}) => Logger.error(msg, { component: MODULE_ID, ...ctx }),
  debug: (msg, ctx = {}) => Logger.debug(msg, { component: MODULE_ID, ...ctx })
};"""

PATTERNS = {
    'console_call': re.compile(r'console\.(log|warn|error|debug)\s*\(', re.MULTILINE),
    'old_log_function': re.compile(r'bconst\s+_log\s*=\s*\([^)]*\)\s*=>\s*\{[^}]+console\.(error|warn|log)[^}]+\};?', re.MULTILINE | re.DOTALL),
    'debug_enabled': re.compile(r'const\s+_debug(Enabled)?\s*=\s*\(\)\s*=>\s*[^;]+;', re.MULTILINE),
    'module_id': re.compile(r"const\s+MODULE_ID\s*=\s*['\"]([^'\"]+)['\"]"),
    'version': re.compile(r"const\s+VERSION\s*=\s*['\"]([^'\"]+)['\"]"),
    'logger_import_exists': re.compile(r"import\s*\{\s*Logger\s*\}\s*from\s*['\"][^'\"]*logger-global"),
    'use_strict': re.compile(r"['\"]use strict['\"];?"),
}

def count_console_calls(content):
    return len(PATTERNS['console_call'].findall(content))

def has_logger_import(content):
    return bool(PATTERNS['logger_import_exists'].search(content))

def extract_module_id(content):
    match = PATTERNS['module_id'].search(content)
    return match.group(1) if match else None

def extract_version(content):
    match = PATTERNS['version'].search(content)
    return match.group(1) if match else None

def should_skip_file(filepath):
    for excluded in CONFIG['excluded_files']:
        if excluded in filepath: return True
    for excluded in CONFIG['excluded_dirs']:
        if f'/{excluded}/' in filepath: return True
    return False

def scan_files(base_path):
    results = []
    for root, dirs, files in os.walk(base_path):
        dirs[:] = [d for d in dirs if d not in CONFIG['excluded_dirs']]
        for filename in files:
            if not filename.endswith('.js'): continue
            filepath = os.path.join(root, filename)
            if should_skip_file(filepath): continue
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                count = count_console_calls(content)
                if count > 0:
                    results.append({
                        'path': filepath,
                        'relative': filepath.replace(base_path + '/', ''),
                        'console_count': count,
                        'has_logger_import': has_logger_import(content),
                        'module_id': extract_module_id(content),
                        'needs_migration': not has_logger_import(content)
                    })
            except Exception as e:
                print(f"Erro ao ler {filepath}: {e}")
    results.sort(key=lambda x: x['console_count'], reverse=True)
    return results

def create_backup(filepath):
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = os.path.basename(filepath)
    backup_file = os.path.join(CONFIG['backup_path'], f"{filename}.bak_{timestamp}")
    shutil.copy2(filepath, backup_file)
    return backup_file

def update_version(version):
    if not version: return '1.0.0-LOGGER-ENTERPRISE'
    base = re.sub(r'-[A-Z\-]+$', '', version)
    parts = base.split('.')
    if len(parts) >= 3:
        try: parts[2] = str(int(parts[2]) + 1)
        except: pass
    return '.'.join(parts) + '-LOGGER-ENTERPRISE'

def migrate_file(filepath, dry_run=False):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if has_logger_import(content):
            return {'success': True, 'skipped': True, 'reason': 'already_migrated'}
        
        module_id = extract_module_id(content)
        version = extract_version(content)
        
        if not module_id:
            return {'success': False, 'error': 'MODULE_ID not found'}
        
        changes = []
        
        # Remover _log antigo
        if PATTERNS['old_log_function'].search(content):
            content = PATTERNS['old_log_function'].sub('', content)
            changes.append('removed_old_log')
        
        if PATTERNS['debug_enabled'].search(content):
            content = PATTERNS['debug_enabled'].sub('', content)
            changes.append('removed_debug_enabled')
        
        # Adicionar import
        use_strict = PATTERNS['use_strict'].search(content)
        if use_strict:
            pos = use_strict.end()
            while pos < len(content) and content[pos] in '\n\r': pos += 1
            content = content[:pos] + '\n\n' + CONFIG['logger_import'] + '\n' + content[pos:]
        else:
            content = CONFIG['logger_import'] + '\n\n' + content
        changes.append('added_logger_import')
        
        # Adicionar objeto log
        module_match = PATTERNS['module_id'].search(content)
        if module_match and 'const log = {' not in content:
            pos = module_match.end()
            ver_match = PATTERNS['version'].search(content[pos:])
            if ver_match:
                pos += ver_match.end()
            while pos < len(content) and content[pos] != '\n': pos += 1
            content = content[:pos] + '\n\n' + LOG_OBJECT + '\n' + content[pos:]
            changes.append('added_log_object')
        
        # Substituir _log()
        content = re.sub(r"_log\s*\(\s*['\"]info['\"]\s*,\s*", "log.info(", content)
        content = re.sub(r"_log\s*\(\s*['\"]warn['\"]\s*,\s*", "log.warn(", content)
        content = re.sub(r"_log\s*\(\s*['\"]error['\"]\s*,\s*", "log.error(", content)
        content = re.sub(r"_log\s*\(\s*['\"]debug['\"]\s*,\s*", "log.debug(", content)
        
        # Substituir console.*
        content = re.sub(r'console\.log\s*\(', 'log.info(', content)
        content = re.sub(r'console\.warn\s*\(', 'log.warn(', content)
        content = re.sub(r'console\.error\s*\(', 'log.error(', content)
        content = re.sub(r'console\.debug\s*\(', 'log.debug(', content)
        changes.append('replaced_console_calls')
        
        # Atualizar versao
        if version:
            new_v = update_version(version)
            content = re.sub(r"(const\s+VERSION\s*=\s*['\"])[^'\"]+(['\"])", f"\\g<1>{new_v}\\g<2>", content)
            content = re.sub(r"(@version\s+)[^\n]+", f"\\g<1>{new_v}", content)
            changes.append(f'version_{new_v}')
        
        # Limpar linhas em branco excessivas
        content = re.sub(r'\n{4,}', '\n\n\n', content)
        
        if dry_run:
            return {'success': True, 'dry_run': True, 'changes': changes}
        
        backup = create_backup(filepath)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return { 'success': True, 'backup': backup, 'changes': changes }
    
    except Exception as e:
        return { 'success': False, 'error': str(e) }

def validate_syntax(filepath):
    try:
        result = subprocess.run(['node', '--check', filepath], capture_output=True, text=True, timeout=10)
        return result.returncode == 0, result.stderr
    except Exception as e:
        return False, str(e)

def main():
    parser = argparse.ArgumentParser(description='Logger Enterprise Migration Tool')
    parser.add_argument('--scan', action='store_true', help='Escaneia arquivos')
    parser.add_argument('--migrate', action='store_true', help='Executa migracao')
    parser.add_argument('--dry-run', action='store_true', help='Simula sem alterar')
    parser.add_argument('--limit', type=int, default=0, help='Limitar quantidade')
    parser.add_argument('--file', type=str, help='Arquivo especifico')
    
    args = parser.parse_args()
    
    if args.scan or not (args.migrate):
        results = scan_files(CONFIG['base_path'])
        needs = [r for r in results if r['needs_migration']]
        
        print(f"\n========================================================");
        print(f"TOTAL COM console.*: {len(results)}")
        print(f"PRECISAM MIGRACAO: {len(needs)}")
        print(f"========================================================\n")
        
        for i, r in enumerate(needs[:50], 1):
            print(f"{i:3}. [{r['console_count']:2}] {r['relative']}")
        
        if len(needs) > 50:
            print(f"\n... e mais {len(needs) - 50} arquivos")
        return
    
    if args.migrate:
        if args.file:
            files = [{'path': args.file, 'relative': args.file}]
        else:
            results = scan_files(CONFIG['base_path'])
            files = [r for r in results if r['needs_migration']]
        
        if args.limit > 0:
            files = files[:args.limit]
        
        print(f"\nMigrando {len(files)} arquivos...\n")
        
        migrated = 0
        errors = 0
        skipped = 0
        
        for f in files:
            print(f"{f['relative']}", end=' ')
            r = migrate_file(f['path'], args.dry_run)
            
            if r.get('skipped'):
                print("SUMPED")
                skipped += 1
            elif r['success']:
                valid, err = validate_syntax(f['path']) if not args.dry_run else (True, None)
                if valid:
                    print("OK")
                    migrated += 1
                else:
                    print(f"SYNTAX_ERROR: {err}")
                    errors += 1
            else:
                print(f"ERROR: {r.get('error')}")
                errors += 1
        
        print(f"\n========================================================")
        print(f"MIGRATED: {migrated} | SKIPPED: {skipped} | ERRORS: {errors}")
        print(f"========================================================")
        
        if not args.dry_run and migrated > 0:
            print("\nExecute:")
            print("sudo chown -R www-data:www-data /var/www/dshowdash/public/components/")
            print("sudo systemctl reload nginx")

if __name__ == '__main__':
    main()
