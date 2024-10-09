import {Component, Input} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import {NgForOf, NgIf} from "@angular/common";
import {MatProgressSpinner} from "@angular/material/progress-spinner";

export interface Pepper {
  id: number | string;
  color: number;
  tamanoForma: number;
  ausenciaDefectos: number;
  texturaFirmeza: number;
  estadoPedunculo: number;
  uniformidad: number;
  valor?: string; // Base64 image
  observaciones?: string;
}

@Component({
  selector: 'app-pepper-analysis',
  standalone: true,
  imports: [MatTableModule, MatCardModule, MatButtonModule, MatInputModule, NgIf, NgForOf, MatProgressSpinner],
  template: `
        <mat-card class="card">
        @if (isProcessing) {
          <div class="spinner-container">
            <mat-spinner></mat-spinner>
          </div>
        }
          @if (peppers.length > 0) {
            <mat-card-content style="width: 100%">
              <div *ngFor="let pimiento of peppers" class="foto-observaciones-container">
                <div class="foto-box">
                  <img *ngIf="pimiento.valor" [src]="pimiento.valor" alt="Foto del pimiento"/>
                </div>
                <div class="observaciones-box">
                  <mat-card>
                    <mat-card-header>
                      <mat-card-title>Observaciones</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <p>{{ pimiento.observaciones }}</p>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>

              <table mat-table [dataSource]="peppers">
                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef>ID</th>
                  <td mat-cell *matCellDef="let pimiento">{{ pimiento.id }}</td>
                </ng-container>

                <ng-container matColumnDef="color">
                  <th mat-header-cell *matHeaderCellDef>Color</th>
                  <td mat-cell *matCellDef="let pimiento">{{ pimiento.color }}</td>
                </ng-container>

                <ng-container matColumnDef="tamanoForma">
                  <th mat-header-cell *matHeaderCellDef>Tamaño y Forma</th>
                  <td mat-cell *matCellDef="let pimiento">{{ pimiento.tamanoForma }}</td>
                </ng-container>

                <ng-container matColumnDef="ausenciaDefectos">
                  <th mat-header-cell *matHeaderCellDef>Ausencia de Defectos</th>
                  <td mat-cell *matCellDef="let pimiento">{{ pimiento.ausenciaDefectos }}</td>
                </ng-container>

                <ng-container matColumnDef="texturaFirmeza">
                  <th mat-header-cell *matHeaderCellDef>Textura y Firmeza</th>
                  <td mat-cell *matCellDef="let pimiento">{{ pimiento.texturaFirmeza }}</td>
                </ng-container>

                <ng-container matColumnDef="estadoPedunculo">
                  <th mat-header-cell *matHeaderCellDef>Estado del Pedúnculo</th>
                  <td mat-cell *matCellDef="let pimiento">{{ pimiento.estadoPedunculo }}</td>
                </ng-container>

                <ng-container matColumnDef="uniformidad">
                  <th mat-header-cell *matHeaderCellDef>Uniformidad</th>
                  <td mat-cell *matCellDef="let pimiento">{{ pimiento.uniformidad }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </mat-card-content>

          }


      </mat-card>

  `,
  styles: [`
    .card {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .spinner-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }
    table {
      width: 100%;
    }
    .mat-mdc-card {
      margin: 20px;
    }
    button {
      margin-bottom: 20px;
    }
    .mat-mdc-footer-row {
      font-weight: bold;
      background-color: #f5f5f5;
    }
    .foto-observaciones-container {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    .foto-box {
      width: 100px;
      height: 70px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 20px;
      overflow: hidden; /* Agregar esta línea */
    }
    img {
      max-width: 100%;
      max-height: 100%; /* Asegura que la imagen no sea más alta que el contenedor */
      height: auto;
    }
    .observaciones-box {
      flex: 1;
    }
  `]
})
export class PepperAnalysisComponent {
  displayedColumns: string[] = ['color', 'tamanoForma', 'ausenciaDefectos', 'texturaFirmeza', 'estadoPedunculo', 'uniformidad'];
  @Input('peppers') peppers: Pepper[] = [];
  @Input('summaryObs') summaryObs: string = '';
  @Input('isProcessing') isProcessing: boolean = false;

  listenSummary() {
    const utterance = new SpeechSynthesisUtterance(this.summaryObs);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
  }


}
