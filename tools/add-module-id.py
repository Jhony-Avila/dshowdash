#!/usr/bin/env python3
"""
Add MODULE_ID Tool v1.0.0
Adiciona MODULE_ID e VERSION a arquivos que nao possuem

Uso:
  python3 add-module-id.py --scan           # Listar arquivos sem MODULE_ID
  python3 add-module-id.py --fix --dry-run  # Simular correcao
  python3 add-module-id.py --fix            # Aplicar correcao
  python3 add-module-id.py --report         # Gerar relatorio completo
"""

import os
import re
import sys
import json
import subprocess
import shutil
from datetime import datetime
import argparse

CONFIG = {
    'base_path': '/var/www/dshowdash/public/components',
    'backup_path': '/backup',
    'report_path': '/var/www/dshowdash/tools/reports',
    'excluded_dirs': ['node_modules', '.git', 'vendor', 'dist'],
    'excluded_files': ['logger-global', 'index.min.js'],
}

PATTERNS = {
    'module_id': re.compile(r"const\s+MODULE_ID\s*=\s*['\"]([^'\"]+)['\"]"),
    'version': re.compile(r"const\s+VERSION\s*=\s*['\"]([^'\"]+)['\"]"),
    'use_strict': re.compile(r"['\"]use strict['\"];?"),
    'at_version': re.compile(r'@version\s+([^\n\s]+)'),
    'console_call': re.compile(r'console\.(log|warn|error|debug)\s*\('),
    'first_import': re.compile(r'^import\s+', re.MULTILINE),
    'log_bracket': re.compile(r'\[[?ParentPanelCard\-]+([^\]]+)\]'),
}

class Stats:
    def __init__(self):
        self.scanned = 0
        self.missing_module_id = 0
        self.fixed = 0
        self.skipped = 0
        self.errors = []
        self.success = []

def infer_module_id(filepath, content):
    """Infere MODULE_ID do caminho ou conteudo do arquivo"""
    
    # Tenta extrair do padrao [Card-02] ou [Panel-12] no codigo
    bracket_match = re.search(r'\[([Cc]ard|[Pp]anel|[Pp]age)[-_]?(\d+)', content)
    if bracket_match:
        prefix = bracket_match.group(1).lower()
        num = bracket_match.group(2)
        return f"{prefix}-{num.zfill(2)}"
    
    # Infere do caminho
    rel_path = filepath.replace(CONFIG['base_path'] + '/', '')
    parts = rel_path.split('/')
    
    # cards/card-02/index.js -> card-02
    if parts[0] == 'cards' and len(parts) >= 2:
        return parts[1]
    
    # panels/panel-12/index.js -> panel-12
    # panels/panel-12/ui/table.js -> panel-12-table
    if parts[0] == 'panels' and len(parts) >= 2:
        base = parts[1]
        if len(parts) > 3 and parts[-1] != 'index.js':
            subname = parts[-1].replace('.js', '')
            return f"{base}-{subname}"
        return base
    
    # pages/geral/cards/card-02/index.js -> page-geral-card-02
    # pages/geral/ui/component.js -> page-geral-component
    if parts[0] == 'pages' and len(parts) >= 2:
        page_name = parts[1]
        if len(parts) >= 4 and parts[2] == 'cards':
            return f"page-{page_name}-{parts[3]}"
        if len(parts) >= 3 and parts[-1] != 'index.js':
            subname = parts[-1].replace('.js', '')
            if subname not in ['logger', 'helpers']:
                return f"page-{page_name}-{subname}"
        if parts[-1] == 'index.js' and parts[2] == 'panel-cards':
            return f"page-{page_name}-panel-cards"
        return f"page-{page_name}"
    
    # modal-manager-global/utils/helpers.js -> modal-manager-helpers
    # footer/components/status-cpu/index.js -> footer-status-cpu
    if len(parts) >= 2:
        base = parts[0]
        if parts[-1] != 'index.js':
            subname = parts[-1].replace('.js', '')
            if len(parts) >= 3 and parts[1] == 'components':
                return f"{base}-{parts[2]}"
            return f"{base}-{subname}"
        if len(parts) >= 3 and parts[1] == 'components':
            return f"{base}-{parts[2]}"
        return f"{base}-{parts[1]}"
    
    # Fallback: nome do arquivo
    return parts[-1].replace('.js', '')

def extract_version(content):
    """Extrai versao existente ou retorna default"""
    match = PATTERNS['version'].search(content)
    if match:
        return match.group(1)
    match = PATTERNS['at_version'].search(content)
    if match:
        return match.group(1)
    return '1.0.0-ENTERPRISE'

def has_module_id(content):
    return bool(PATTERNS['module_id'].search(content))

def has_version(content):
    return bool(PATTERNS['version'].search(content))

def should_skip_file(filepath):
    for excluded in CONFIG['excluded_files']:
        if excluded in filepath:
            return True
    for excluded in CONFIG['excluded_dirs']:
        if f'/{excluded}/' in filepath:
            return True
    return False

def scan_files(base_path):
    """Escaneia arquivos sem MODULE_ID"""
    results = []
    for root, dirs, files in os.walk(base_path):
        dirs[:] = [d for d in dirs if d not in CONFIG['excluded_dirs']]
        for filename in files:
            if not filename.endswith('.js'):
                continue
            filepath = os.path.join(root, filename)
            if should_skip_file(filepath):
                continue
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                if not has_module_id(content):
                    has_console = bool(PATTERNS['console_call'].search(content))
                    inferred_id = infer_module_id(filepath, content)
                    results.append({
                        'path': filepath,
                        'relative': filepath.replace(base_path + '/', ''),
                        'inferred_id': inferred_id,
                        'has_version': has_version(content),
                        'has_console': has_console,
                        'existing_version': extract_version(content)
                    })
            except Exception as e:
                print(f"Erro ao ler {filepath}: {e}")
    return results

def create_backup(filepath):
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = os.path.basename(filepath)
    backup_file = os.path.join(CONFIG['backup_path'], f"{filename}.bak_{timestamp}")
    shutil.copy2(filepath, backup_file)
    return backup_file

def validate_syntax(filepath):
    try:
        result = subprocess.run(
            ['node', '--check', filepath],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.returncode == 0, result.stderr
    except Exception as e:
        return False, str(e)

def add_module_id(filepath, module_id, version, dry_run=False):
    """Adiciona MODULE_ID e VERSION ao arquivo"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Ja tem MODULE_ID
        if has_module_id(content):
            return {'success': True, 'skipped': True, 'reason': 'already_has_module_id'}
        
        # Preparar linhas a adicionar
        module_line = f"const MODULE_ID = '{module_id}';"
        version_line = f"const VERSION = '{version}';" if not has_version(content) else None
        
        # Encontrar posicao ideal para inserir (depois de 'use strict' ou imports)
        lines = content.split('\n')
        insert_pos = 0
        
        # Procurar posicao ideal
        for i, line in enumerate(lines):
            stripped = line.strip()
            # Pular comentarios iniciais
            if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
                insert_pos = i + 1
                continue
            # Pular 'use strict'
            if 'use strict' in stripped:
                insert_pos = i + 1
                continue
            # Pular linhas vazias apos comentarios/use strict
            if not stripped:
                insert_pos = i + 1
                continue
            # Parar antes de imports ou codigo
            if stripped.startswith('import') or stripped.startswith('const') or stripped.startswith('let') or stripped.startswith('function') or stripped.startswith('class'):
                break
        
        # Inserir linhas
        new_lines = []
        if version_line:
            new_lines = [module_line, version_line, '']
        else:
            new_lines = [module_line, '']
        
        lines = lines[:insert_pos] + new_lines + lines[insert_pos:]
        new_content = '\n'.join(lines)
        
        # Limpar linhas em branco excessivas
        new_content = re.sub(r'\n{4,}', '\n\n\n', new_content)
        
        if dry_run:
            return { 'success': True, 'dry_run': True, 'module_id': module_id }
        
        # Criar backup
        backup = create_backup(filepath)
        
        # Salvar arquivo
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        # Validar sintaxe
        valid, error = validate_syntax(filepath)
        if not valid:
            # Restaurar backup em caso de erro
            shutil.copy2(backup, filepath)
            return { 'success': False, 'error': f'Syntax error: {error}', 'restored': True }
        
        return {
            'success': True,
            'backup': backup,
            'module_id': module_id,
            'version_added': version_line is not None
        }
        
    except Exception as e:
        return { 'success': False, 'error': str(e) }

def generate_report(stats, results):
    """Gera relatorio detalhado"""
    os.makedirs(CONFIG['report_path'], exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    report = {
        'timestamp': timestamp,
        'summary': {
            'scanned': stats.scanned,
            'missing_module_id': stats.missing_module_id,
            'fixed': stats.fixed,
            'skipped': stats.skipped,
            'errors': len(stats.errors)
        },
        'errors': stats.errors,
        'success': stats.success,
        'pending': [r for r in results if r['relative'] not in [s['file'] for s in stats.success]]
    }
    
    report_file = os.path.join(CONFIG['report_path'], f'module_id_report_{timestamp}.json')
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\nRelatorio salvo em: {report_file}")
    return report_file

def main():
    parser = argparse.ArgumentParser(description='Add MODULE_ID Tool')
    parser.add_argument('--scan', action='store_true', help='Listar arquivos sem MODULE_ID')
    parser.add_argument('--fix', action='store_true', help='Adicionar MODULE_ID aos arquivos')
    parser.add_argument('--dry-run', action='store_true', help='Simular sem alterar')
    parser.add_argument('--limit', type=int, default=0, help='Limitar quantidade')
    parser.add_argument('--report', action='store_true', help='Gerar relatorio detalhado')
    
    args = parser.parse_args()
    
    print("\n========================================================")
    print("ADD MODULE_ID TOOL v1.0.0")
    print("=========================================================\n")
    
    stats = Stats()
    results = scan_files(CONFIG['base_path'])
    stats.scanned = len(results)
    stats.missing_module_id = len(results)
    
    if args.scan or not args.fix:
        print(f"Arquivos sem MODULE_ID: {len(results)}\n")
        for i, r in enumerate(results[:50], 1):
            console_mark = "*" if r['has_console'] else " "
            print(f"{i:3}. {console_mark} {r['relative']:55s} -> {r['inferred_id']}")
        if len(results) > 50:
            print(f"\n... e mais {len(results) - 50} arquivos")
        print(f"\n* = tem console.* (precisa migrar Logger)")
        return
    
    if args.fix:
        files = results
        if args.limit > 0:
            files = files[:args.limit]
        
        print(f"Processando {len(files)} arquivos...\n")
        
        for f in files:
            print(f"{f['relative']:55s}", end=' ')
            result = add_module_id(
                f['path'],
                f['inferred_id'],
                f['existing_version'],
                args.dry_run
            )
            
            if result.get('skipped'):
                print("SKIPPED")
                stats.skipped += 1
            elif result['success']:
                print(f"OK -> {result['module_id']}")
                stats.fixed += 1
                stats.success.append({
                    'file': f['relative'],
                    'module_id': result['module_id']
                })
            else:
                print(f"ERROR: {result.get('error')}")
                stats.errors.append({
                    'file': f['relative'],
                    'error': result.get('error')
                })
        
        print(f"\n========================================================")
        print(f"FIXED: {stats.fixed} | SKIPPED: {stats.skipped} | ERRORS: {len(stats.errors)}")
        print(f"========================================================")
        
        if len(stats.errors) > 0:
            print("\nERROS: ")
            for e in stats.errors:
                print(f"  - {e['file']}: {e['error']}")
        
        if not args.dry_run and stats.fixed > 0:
            print("\nExecute:")
            print("sudo chown -R www-data:www-data /var/www/dshowdash/public/components/")
            print("sudo systemctl reload nginx")
    
    if args.report:
        generate_report(stats, results)

if __name__ == '__main__':
    main()
