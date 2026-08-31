#!/usr/bin/env bash
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
EX="$HERE/07-trackd-wave3-server-gate.sh"
echo "BASH_SYNTAX:"; bash -n "$EX" && echo OK || echo FAIL
echo "RESCOPE_SELFTEST:"; awk '/^B64_PROOFS$/{f=0} f{print} /<<.B64_PROOFS.$/{f=1}' "$EX" | base64 -d > /tmp/07gp.mjs 2>/dev/null; RESCOPE_SELFTEST=1 node /tmp/07gp.mjs 2>/dev/null | head -c 400; echo; rm -f /tmp/07gp.mjs
echo "DRY_RUN:"; DRYRUN=1 bash "$EX" >/tmp/07self-dry.log 2>&1 && grep -q DRYRUN_OK=YES /tmp/07self-dry.log && echo PASS || echo FAIL
echo "FAIL_CLOSED_WRONG_SHA:"; if DRYRUN=1 EXPECTED_COMMIT=deadbeef bash "$EX" >/dev/null 2>&1; then echo FAIL; else echo PASS; fi
echo "FAIL_CLOSED_WRONG_HASH:"; if DRYRUN=1 SELFTEST_BAD_HASH=1 bash "$EX" >/tmp/07self-h.log 2>&1; then echo FAIL; else grep -qi "identidade servida FAILED" /tmp/07self-h.log && echo PASS || echo PASS-abort; fi
rm -f /tmp/07self-dry.log /tmp/07self-h.log
