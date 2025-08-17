// Script para otimizar logs na aplicação
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Configurações
const projectRoot = process.cwd()
const excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build']
const includeExtensions = ['.ts', '.tsx', '.js', '.jsx']

// Função para verificar se um diretório deve ser excluído
function shouldExcludeDir(dirPath) {
  return excludeDirs.some(excludeDir => dirPath.includes(excludeDir))
}

// Função para verificar se um arquivo deve ser processado
function shouldProcessFile(filePath) {
  return includeExtensions.some(ext => filePath.endsWith(ext))
}

// Função para encontrar todos os arquivos relevantes
function findFiles(dir, files = []) {
  if (shouldExcludeDir(dir)) return files
  
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      findFiles(fullPath, files)
    } else if (shouldProcessFile(fullPath)) {
      files.push(fullPath)
    }
  }
  
  return files
}

// Função para analisar logs em um arquivo
function analyzeLogs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const issues = []
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1
    
    // Detectar console.log diretos
    if (line.includes('console.log') && !line.includes('//')) {
      issues.push({
        type: 'console.log',
        line: lineNumber,
        content: line.trim(),
        severity: 'medium'
      })
    }
    
    // Detectar console.error diretos
    if (line.includes('console.error') && !line.includes('//')) {
      issues.push({
        type: 'console.error',
        line: lineNumber,
        content: line.trim(),
        severity: 'low'
      })
    }
    
    // Detectar console.warn diretos
    if (line.includes('console.warn') && !line.includes('//')) {
      issues.push({
        type: 'console.warn',
        line: lineNumber,
        content: line.trim(),
        severity: 'low'
      })
    }
    
    // Detectar console.info diretos
    if (line.includes('console.info') && !line.includes('//')) {
      issues.push({
        type: 'console.info',
        line: lineNumber,
        content: line.trim(),
        severity: 'medium'
      })
    }
    
    // Detectar logs em produção sem verificação de ambiente
    if ((line.includes('console.') || line.includes('debugLog')) && 
        !line.includes('process.env.NODE_ENV') && 
        !line.includes('logger.') &&
        !line.includes('//')) {
      issues.push({
        type: 'production_log',
        line: lineNumber,
        content: line.trim(),
        severity: 'high'
      })
    }
  })
  
  return issues
}

// Função para gerar relatório
function generateReport(results) {
  const report = {
    summary: {
      totalFiles: results.length,
      filesWithIssues: results.filter(r => r.issues.length > 0).length,
      totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
      issuesBySeverity: {
        high: 0,
        medium: 0,
        low: 0
      }
    },
    files: results.filter(r => r.issues.length > 0)
  }
  
  // Contar issues por severidade
  results.forEach(file => {
    file.issues.forEach(issue => {
      report.summary.issuesBySeverity[issue.severity]++
    })
  })
  
  return report
}

// Função para exibir relatório
function displayReport(report) {
  logger.debug('MODULE', '\n🔍 RELATÓRIO DE OTIMIZAÇÃO DE LOGS\n')
  logger.debug('MODULE', '📊 RESUMO:')
  logger.debug('MODULE', `   Total de arquivos analisados: ${report.summary.totalFiles}`)
  logger.debug('MODULE', `   Arquivos com problemas: ${report.summary.filesWithIssues}`)
  logger.debug('MODULE', `   Total de problemas: ${report.summary.totalIssues}`)
  logger.debug('MODULE', '\n🚨 PROBLEMAS POR SEVERIDADE:')
  logger.debug('MODULE', `   🔴 Alta (logs em produção): ${report.summary.issuesBySeverity.high}`)
  logger.debug('MODULE', `   🟡 Média (console.log/info): ${report.summary.issuesBySeverity.medium}`)
  logger.debug('MODULE', `   🟢 Baixa (console.error/warn): ${report.summary.issuesBySeverity.low}`)
  
  if (report.files.length > 0) {
    logger.debug('MODULE', '\n📁 ARQUIVOS COM PROBLEMAS:\n')
    
    report.files.forEach(file => {
      const relativePath = path.relative(projectRoot, file.path)
      logger.debug('MODULE', `📄 ${relativePath}`)
      
      file.issues.forEach(issue => {
        const icon = issue.severity === 'high' ? '🔴' : 
                    issue.severity === 'medium' ? '🟡' : '🟢'
        logger.debug('MODULE', `   ${icon} Linha ${issue.line}: ${issue.type}`)
        logger.debug('MODULE', `      ${issue.content}`)
      })
      console.log()
    })
  }
  
  // Recomendações
  logger.debug('MODULE', '💡 RECOMENDAÇÕES:')
  logger.debug('MODULE', '   1. Substitua console.log por logger.debug() ou logger.info()')
  logger.debug('MODULE', '   2. Substitua console.error por logger.error()')
  logger.debug('MODULE', '   3. Substitua console.warn por logger.warn()')
  logger.debug('MODULE', '   4. Use contextos específicos para cada módulo')
  logger.debug('MODULE', '   5. O sistema de logs já filtra automaticamente em produção')
  logger.debug('MODULE', '\n✅ Para aplicar as correções automaticamente, execute:')
  logger.debug('MODULE', '   node scripts/optimize-logs.js --fix')
}

// Função para aplicar correções automáticas
function applyFixes(results) {
  logger.debug('MODULE', '🔧 Aplicando correções automáticas...\n')
  
  let totalFixed = 0
  
  results.forEach(file => {
    if (file.issues.length === 0) return
    
    let content = fs.readFileSync(file.path, 'utf8')
    let modified = false
    
    // Adicionar import do logger se necessário
    if (!content.includes("import { logger }") && 
        !content.includes("from '@/lib/logger'")) {
      
      // Encontrar a última linha de import
      const lines = content.split('\n')
      let lastImportIndex = -1
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIndex = i
        }
      }
      
      if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, "import { logger } from '@/lib/logger'")
        content = lines.join('\n')
        modified = true
      }
    }
    
    // Substituir console.log por logger.debug
    content = content.replace(
      /console\.log\(([^)]+)\)/g, 
      (match, args) => {
        totalFixed++
        return `logger.debug('MODULE', ${args})`
      }
    )
    
    // Substituir console.error por logger.error
    content = content.replace(
      /console\.error\(([^)]+)\)/g, 
      (match, args) => {
        totalFixed++
        return `logger.error('MODULE', ${args})`
      }
    )
    
    // Substituir console.warn por logger.warn
    content = content.replace(
      /console\.warn\(([^)]+)\)/g, 
      (match, args) => {
        totalFixed++
        return `logger.warn('MODULE', ${args})`
      }
    )
    
    // Substituir console.info por logger.info
    content = content.replace(
      /console\.info\(([^)]+)\)/g, 
      (match, args) => {
        totalFixed++
        return `logger.info('MODULE', ${args})`
      }
    )
    
    if (modified || totalFixed > 0) {
      fs.writeFileSync(file.path, content, 'utf8')
      logger.debug('MODULE', `✅ ${path.relative(projectRoot, file.path)} - ${file.issues.length} problemas corrigidos`)
    }
  })
  
  logger.debug('MODULE', `\n🎉 Total de ${totalFixed} problemas corrigidos!`)
  logger.debug('MODULE', '\n⚠️  ATENÇÃO: Revise os arquivos modificados e ajuste os contextos dos logs conforme necessário.')
}

// Função principal
function main() {
  const shouldFix = process.argv.includes('--fix')
  
  logger.debug('MODULE', '🚀 Iniciando análise de logs...')
  
  // Encontrar todos os arquivos
  const files = findFiles(projectRoot)
  logger.debug('MODULE', `📁 Analisando ${files.length} arquivos...`)
  
  // Analisar cada arquivo
  const results = files.map(filePath => ({
    path: filePath,
    issues: analyzeLogs(filePath)
  }))
  
  // Gerar e exibir relatório
  const report = generateReport(results)
  displayReport(report)
  
  // Aplicar correções se solicitado
  if (shouldFix) {
    applyFixes(results)
  }
}

// Executar script
if (require.main === module) {
  main()
}

module.exports = { analyzeLogs, generateReport, findFiles }