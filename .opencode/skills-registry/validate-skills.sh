#!/usr/bin/env bash
set -euo pipefail

echo "Validando skills em .opencode/skills..."

for skill_dir in .opencode/skills/*; do
  [ -d "$skill_dir" ] || continue

  skill_name="$(basename "$skill_dir")"

  if [ ! -f "$skill_dir/SKILL.md" ]; then
    echo "ERRO: $skill_name não tem SKILL.md"
    exit 1
  fi

  if ! grep -q "^name: $skill_name$" "$skill_dir/SKILL.md"; then
    echo "AVISO: $skill_name pode ter name diferente do diretório"
  fi

  if ! grep -q "^description:" "$skill_dir/SKILL.md"; then
    echo "ERRO: $skill_name não tem description"
    exit 1
  fi

  echo "OK: $skill_name"
done

echo "Validação concluída."
