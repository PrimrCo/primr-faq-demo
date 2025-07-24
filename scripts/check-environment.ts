#!/usr/bin/env node

/**
 * Check environment configuration for primr-faq-demo
 * Verifies required environment variables and dependencies
 */

import fs from 'fs';
import path from 'path';

interface EnvCheckResult {
  name: string;
  required: boolean;
  present: boolean;
  value?: string;
}

function checkEnvironmentVariables(): EnvCheckResult[] {
  const requiredVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY', 
    'AWS_S3_BUCKET',
    'AWS_REGION',
    'OPENAI_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    'MONGODB_URI'
  ];

  const optionalVars = [
    'NODE_ENV'
  ];

  const results: EnvCheckResult[] = [];

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    results.push({
      name: varName,
      required: true,
      present: !!value,
      value: value ? `${value.substring(0, 10)}...` : undefined
    });
  }

  // Check optional variables
  for (const varName of optionalVars) {
    const value = process.env[varName];
    results.push({
      name: varName,
      required: false,
      present: !!value,
      value: value
    });
  }

  return results;
}

function checkDependencies(): { name: string; present: boolean; version?: string }[] {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return [{ name: 'package.json', present: false }];
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const requiredDeps = [
    'openai',
    'mongodb',
    '@aws-sdk/client-s3',
    'pdf-parse',
    'mammoth',
    'xlsx'
  ];

  return requiredDeps.map(dep => ({
    name: dep,
    present: !!(packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]),
    version: packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
  }));
}

function main() {
  console.log('🔍 Primr FAQ Demo Environment Check\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  const envResults = checkEnvironmentVariables();
  
  let allRequiredPresent = true;
  for (const result of envResults) {
    const status = result.present ? '✅' : (result.required ? '❌' : '⚠️');
    const valueDisplay = result.present && result.value ? ` (${result.value})` : '';
    console.log(`  ${status} ${result.name}${valueDisplay}`);
    
    if (result.required && !result.present) {
      allRequiredPresent = false;
    }
  }

  console.log('\n📦 Dependencies:');
  const depResults = checkDependencies();
  
  let allDepsPresent = true;
  for (const dep of depResults) {
    const status = dep.present ? '✅' : '❌';
    const version = dep.version ? ` (${dep.version})` : '';
    console.log(`  ${status} ${dep.name}${version}`);
    
    if (!dep.present) {
      allDepsPresent = false;
    }
  }

  console.log('\n📄 Supported File Types:');
  const supportedTypes = ['.md', '.txt', '.docx', '.pdf', '.csv', '.xlsx'];
  for (const type of supportedTypes) {
    console.log(`  ✅ ${type}`);
  }

  console.log('\n📊 Summary:');
  if (allRequiredPresent && allDepsPresent) {
    console.log('  ✅ Environment is properly configured!');
    process.exit(0);
  } else {
    console.log('  ❌ Environment configuration issues detected.');
    if (!allRequiredPresent) {
      console.log('     Please set missing required environment variables.');
    }
    if (!allDepsPresent) {
      console.log('     Please install missing dependencies with: npm install');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}