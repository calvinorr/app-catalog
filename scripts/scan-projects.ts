#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { scanProjects } from '../scanner/detect';
import { ScannerConfig } from '../scanner/types';

function loadConfig(configPath: string): ScannerConfig {
  const absolutePath = path.resolve(configPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Config file not found at ${absolutePath}`);
  }
  const raw = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(raw) as ScannerConfig;
}

async function postProjects(apiUrl: string, apiToken: string | undefined, projects: any[]) {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {})
    },
    body: JSON.stringify({ projects })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API responded with ${res.status}: ${text}`);
  }
}

async function main() {
  const configPath = process.argv[2] || 'scan-config.json';
  const config = loadConfig(configPath);
  const projects = scanProjects(config.rootPath);

  console.log(JSON.stringify({ projects }, null, 2));

  if (config.apiUrl) {
    await postProjects(config.apiUrl, config.apiToken, projects);
    console.log(`Posted ${projects.length} projects to ${config.apiUrl}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
