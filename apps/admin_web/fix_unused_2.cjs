const { Project } = require('ts-morph');
const fs = require('fs');

const project = new Project({
  tsConfigFilePath: 'tsconfig.app.json'
});

// Remove unused declarations matching `_` prefix in DailySalesPage
const dailySales = project.getSourceFile('src/features/sales/DailySalesPage.tsx');
if (dailySales) {
  dailySales.getVariableStatements().forEach(stmt => {
    stmt.getDeclarations().forEach(decl => {
      const name = decl.getName();
      if (['_monthlyComparison', '_setStartDate', '_setEndDate'].includes(name)) {
        decl.remove();
      }
    });
  });
  
  // Also remove unused imports
  dailySales.getImportDeclarations().forEach(imp => {
    imp.getNamedImports().forEach(named => {
      const name = named.getName();
      if (['_ArrowUp', '_ArrowDown', '_CreditCard', '_Banknote'].includes(name)) {
        named.remove();
      }
    });
  });
  dailySales.saveSync();
}

const reportsPage = project.getSourceFile('src/features/reports/ReportsPage.tsx');
if (reportsPage) {
  reportsPage.getImportDeclarations().forEach(imp => {
    imp.getNamedImports().forEach(named => {
      const name = named.getName();
      if (['_CustomerAnalyticsItem', '_StaffPerformanceItem'].includes(name)) {
        named.remove();
      }
    });
  });
  reportsPage.saveSync();
}

const tableState = project.getSourceFile('src/hooks/usePersistedTableState.ts');
if (tableState) {
  // Replace (_e: any) => with () =>
  tableState.forEachDescendant(node => {
    if (node.getKindName() === 'Parameter' && node.getName() === '_e') {
      node.remove();
    }
  });
  tableState.saveSync();
}
