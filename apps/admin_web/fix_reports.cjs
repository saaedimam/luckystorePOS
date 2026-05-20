const { Project } = require('ts-morph');

const project = new Project({
  tsConfigFilePath: 'apps/admin_web/tsconfig.app.json'
});

const reportsPage = project.getSourceFile('apps/admin_web/src/features/reports/ReportsPage.tsx');
if (reportsPage) {
  // Remove unused imports
  reportsPage.getImportDeclarations().forEach(imp => {
    imp.getNamedImports().forEach(named => {
      const name = named.getName();
      if (['CustomerAnalyticsItem', 'StaffPerformanceItem'].includes(name)) {
        named.remove();
      }
    });
  });

  // Replace all any with Record<string, unknown>
  reportsPage.forEachDescendant(node => {
    if (node.getKindName() === 'AnyKeyword') {
      node.replaceWithText('Record<string, unknown>');
    }
  });

  reportsPage.saveSync();
  console.log('Fixed ReportsPage');
}

const dailySales = project.getSourceFile('apps/admin_web/src/features/sales/DailySalesPage.tsx');
if (dailySales) {
  dailySales.getVariableStatements().forEach(stmt => {
    stmt.getDeclarations().forEach(decl => {
      const name = decl.getName();
      if (['_monthlyComparison', '_setStartDate', '_setEndDate'].includes(name)) {
        decl.remove();
      }
    });
  });
  
  dailySales.saveSync();
  console.log('Fixed DailySalesPage');
}

const settingsPage = project.getSourceFile('apps/admin_web/src/features/settings/SettingsPage.tsx');
if (settingsPage) {
  settingsPage.getImportDeclarations().forEach(imp => {
    imp.getNamedImports().forEach(named => {
      if (named.getName() === 'useEffect') {
        named.remove();
      }
    });
  });
  settingsPage.saveSync();
  console.log('Fixed SettingsPage');
}

const usePersistedTableState = project.getSourceFile('apps/admin_web/src/hooks/usePersistedTableState.ts');
if (usePersistedTableState) {
  usePersistedTableState.forEachDescendant(node => {
    if (node.getKindName() === 'Parameter' && node.getName() === '_e') {
      node.replaceWithText(''); // removes _e: any
    }
  });
  usePersistedTableState.saveSync();
  console.log('Fixed usePersistedTableState');
}

const tableQuery = project.getSourceFile('apps/admin_web/src/lib/table-query.ts');
if (tableQuery) {
  // fix any remaining issues
}

console.log('Done.');
