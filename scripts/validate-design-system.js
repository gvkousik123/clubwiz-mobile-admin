#!/usr/bin/env node

/**
 * Design System Validation Script
 * Checks for hardcoded values that should use design system classes
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Hardcoded patterns to detect
const hardcodedPatterns = [
    // Background colors
    /bg-gradient-to-[a-z]+ from-slate-\d+/g,
    /bg-blue-\d+/g,
    /bg-white\/\d+/g,
    /bg-black\/\d+/g,
    /bg-gray-\d+/g,

    // Text colors
    /text-white(?!\/)/g,  // text-white but not text-white/opacity
    /text-blue-\d+/g,
    /text-gray-\d+/g,
    /text-slate-\d+/g,

    // Borders
    /border-blue-\d+/g,
    /border-white\/\d+/g,
    /border-gray-\d+/g,

    // Specific deprecated patterns
    /from-slate-\d+/g,
    /to-slate-\d+/g,
    /via-slate-\d+/g,
];

// Design system patterns that should be used instead
const designSystemAlternatives = {
    'bg-gradient-to-b from-slate-900': 'bg-background-primary',
    'text-white': 'text-text-primary',
    'text-blue-400': 'text-primary-500',
    'bg-blue-500/10': 'glass-effect',
    'bg-white/10': 'glass-effect',
    'border-white/20': 'border-border',
};

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    hardcodedPatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
            matches.forEach(match => {
                const lines = content.split('\n');
                const lineNumber = lines.findIndex(line => line.includes(match)) + 1;

                issues.push({
                    file: filePath,
                    line: lineNumber,
                    pattern: match,
                    suggestion: designSystemAlternatives[match] || 'Use design system equivalent'
                });
            });
        }
    });

    return issues;
}

function validateProject() {
    const appFiles = glob.sync('./app/**/*.{tsx,ts,jsx,js}', {
        ignore: ['./node_modules/**', './.next/**']
    });

    const componentFiles = glob.sync('./components/**/*.{tsx,ts,jsx,js}', {
        ignore: ['./node_modules/**', './.next/**']
    });

    const allFiles = [...appFiles, ...componentFiles];
    const allIssues = [];

    allFiles.forEach(file => {
        const issues = scanFile(file);
        allIssues.push(...issues);
    });

    return allIssues;
}

function generateReport(issues) {
    console.log('\\n🎨 Design System Validation Report\\n');
    console.log('='.repeat(50));

    if (issues.length === 0) {
        console.log('✅ No hardcoded values found! All files are using design system classes.');
        return;
    }

    console.log(`❌ Found ${issues.length} hardcoded value(s) that should use design system classes:\\n`);

    // Group by file
    const issuesByFile = issues.reduce((acc, issue) => {
        if (!acc[issue.file]) {
            acc[issue.file] = [];
        }
        acc[issue.file].push(issue);
        return acc;
    }, {});

    Object.entries(issuesByFile).forEach(([file, fileIssues]) => {
        console.log(`📁 ${file}`);
        fileIssues.forEach(issue => {
            console.log(`   Line ${issue.line}: ${issue.pattern}`);
            console.log(`   💡 Suggestion: ${issue.suggestion}`);
            console.log('');
        });
    });

    console.log('\\n📖 For complete migration guide, see: DESIGN_SYSTEM_USAGE.md');

    // Summary
    const uniquePatterns = [...new Set(issues.map(i => i.pattern))];
    console.log('\\n📊 Summary:');
    console.log(`   Files affected: ${Object.keys(issuesByFile).length}`);
    console.log(`   Total issues: ${issues.length}`);
    console.log(`   Unique patterns: ${uniquePatterns.length}`);

    return issues.length;
}

// Run validation
try {
    const issues = validateProject();
    const exitCode = generateReport(issues);
    process.exit(exitCode > 0 ? 1 : 0);
} catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
}