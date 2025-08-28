import { Routes } from '@angular/router';
import { TruthTableGeneratorComponent } from './components/truth-table-generator/truth-table-generator.component';
import { PracticeTableComponent } from './components/practice-table/practice-table.component';

export const routes: Routes = [
    { path: 'generate', component: TruthTableGeneratorComponent },
    { path: 'practice', component: PracticeTableComponent },
    { path: '', redirectTo: '/generate', pathMatch: 'full' },
    { path: '**', redirectTo: '/generate' } // Redirige cualquier otra ruta a la principal
];
