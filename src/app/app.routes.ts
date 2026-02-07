import { Routes } from '@angular/router';

export const routes: Routes = [
    {
      path: 'generate',
      loadComponent: () => import('./components/truth-table-generator/truth-table-generator.component')
        .then(m => m.TruthTableGeneratorComponent)
    },
    {
      path: 'practice',
      loadComponent: () => import('./components/practice-table/practice-table.component')
        .then(m => m.PracticeTableComponent)
    },
    { path: '', redirectTo: '/generate', pathMatch: 'full' },
    { path: '**', redirectTo: '/generate' } // Redirige cualquier otra ruta a la principal
];
