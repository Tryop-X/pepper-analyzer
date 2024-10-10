// Importaciones necesarias
import { Component, Input, OnInit, ViewChild, ElementRef, NgZone, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { interval } from 'rxjs';
import { OpenAIService } from "../services/openai.service";
import { Pepper } from "./pepper-analysis.component";
import { MatCard, MatCardContent } from "@angular/material/card";
import {MatButton, MatIconButton} from "@angular/material/button";
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {NgIf} from "@angular/common";

@Component({
  standalone: true,
  selector: 'app-camera-detection',
  template: `
    <div *ngIf="!isUrlSet" style="display: flex; justify-content: center; align-items: center; margin-top: 10px;">
      <mat-form-field style="width: 70%;">
        <mat-label>Ingrese la URL del servidor</mat-label>
        <input matInput #urlInput type="text" />
        <button mat-icon-button matSuffix color="primary" (click)="setUrl(urlInput.value)">
          <mat-icon>check_circle</mat-icon>
        </button>
      </mat-form-field>
    </div>
    <div *ngIf="!isApiKeySet" style="display: flex; justify-content: center; align-items: center; margin-top: 0;">
      <mat-form-field style="width: 70%;">
        <mat-label>Ingrese el apiKey</mat-label>
        <input matInput #urlInput type="text" />
        <button mat-icon-button matSuffix color="primary" (click)="setApiKey(urlInput.value)">
          <mat-icon>check_circle</mat-icon>
        </button>
      </mat-form-field>
    </div>
    <mat-card>
      <mat-card-content style="position: relative; display: flex; justify-content: center; align-items: center; width: 100%; height: 600px; margin-top: 10px">
        <canvas #canvasElement style="position: absolute;"></canvas>
        <canvas #overlayCanvas style="position: absolute;"></canvas>
        <!-- Botón centrado para cambiar de cámara -->
        <button mat-icon-button color="accent" (click)="switchCamera()" style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%);">
          <mat-icon>flip_camera_android</mat-icon>
        </button>
      </mat-card-content>
      <mat-card-content>
        <button
          style="width: 100%; height: 35px; margin-top: 10px;"
          mat-raised-button color="primary"
          (click)="analyzer()" [disabled]="isProcessing || detectedBoxesArray.length === 0 || !isApiKeySet">Analizar</button>
      </mat-card-content>
    </mat-card>
  `,
  imports: [
    HttpClientModule,
    MatCard,
    MatCardContent,
    MatButton,
    MatIconModule,
    MatIconButton,
    MatFormFieldModule,
    MatInputModule,
    NgIf
  ],
  providers: [
    OpenAIService
  ]
})
export class CameraDetectionComponent implements OnInit {
  @Input() threshold: number = 0.8;
  @ViewChild('canvasElement', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('overlayCanvas', { static: true }) overlayCanvas!: ElementRef<HTMLCanvasElement>;

  private video!: HTMLVideoElement;
  isProcessing: boolean = false;
  detectedBoxesArray: string[] = [];
  isUrlSet: boolean = false;
  isApiKeySet: boolean = false;
  apiKey: string = '';
  serverUrl: string = '';

  @Output('peppers') peppers = new EventEmitter<Pepper[]>();
  @Output('summaryObs') summaryObs = new EventEmitter<string>();

  private devices: MediaDeviceInfo[] = [];
  private currentDeviceIndex: number = 0;

  constructor(
    private openAiService: OpenAIService,
    private http: HttpClient, private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.getAvailableDevices().then(() => {
      this.initializeCamera().then(
        () => {
          interval(750).subscribe(() => {
            if (!this.isProcessing && this.isUrlSet) {
              this.captureAndSendImage();
              console.log(this.isProcessing || this.detectedBoxesArray.length === 0 || !this.isApiKeySet)
            }
          });
        }
      );
    });
  }

  private async getAvailableDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error al obtener los dispositivos: ', error);
    }
  }

  // Inicializa la cámara del usuario
  private async initializeCamera() {
    this.video = document.createElement('video');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: this.devices[this.currentDeviceIndex].deviceId } });
      this.video.srcObject = stream;
      this.video.play();
      this.ngZone.runOutsideAngular(() => {
        this.updateCanvas();
      });
    } catch (error) {
      console.error('Error al acceder a la cámara: ', error);
    }
  }

  // Método para cambiar de cámara
  switchCamera() {
    if (this.devices.length > 1) {
      this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.devices.length;
      this.stopVideoStream();
      this.initializeCamera();
    }
  }

  private stopVideoStream() {
    const stream = this.video.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  // Actualiza el canvas con la imagen del video en tiempo real
  private updateCanvas(): void {
    requestAnimationFrame(() => this.updateCanvas());
    const canvasElement = this.canvas.nativeElement;
    const context = canvasElement.getContext('2d');

    if (context && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      canvasElement.width = this.video.videoWidth;
      canvasElement.height = this.video.videoHeight;
      context.drawImage(this.video, 0, 0, canvasElement.width, canvasElement.height);
    }
  }

  // Captura la imagen de la cámara y envía la solicitud
  private captureAndSendImage(): void {
    const canvasElement = this.canvas.nativeElement;
    const context = canvasElement.getContext('2d');

    if (context && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      context.drawImage(this.video, 0, 0, canvasElement.width, canvasElement.height);

      const imageDataUrl = canvasElement.toDataURL('image/jpeg');
      const image_base64 = imageDataUrl.split(',')[1];

      const data = {
        image_base64: image_base64,
        threshold: this.threshold
      };

      this.http.post<any>(`${this.serverUrl}/process_image`, data).subscribe(
        response => {
          this.drawDetections(response.detections);
        },
        error => {
          console.error('Error en la llamada a la API: ', error);
        }
      );
    }
  }

  // Dibuja las detecciones en un canvas transparente
  private drawDetections(detections: any[]): void {
    const overlayCanvasElement = this.overlayCanvas.nativeElement;
    const overlayContext = overlayCanvasElement.getContext('2d');
    const videoWidth = this.video.videoWidth;
    const videoHeight = this.video.videoHeight;
    this.detectedBoxesArray = [];

    if (overlayContext) {
      // Ajustar el tamaño del canvas overlay al tamaño del video
      overlayCanvasElement.width = videoWidth;
      overlayCanvasElement.height = videoHeight;

      // Limpiar el canvas overlay antes de dibujar nuevas detecciones
      overlayContext.clearRect(0, 0, videoWidth, videoHeight);

      // Dibujar cada detección y guardar cada box como imagen en base64
      detections.forEach(detection => {
        const { x1, y1, x2, y2 } = detection;
        overlayContext.beginPath();
        overlayContext.rect(x1, y1, x2 - x1, y2 - y1);
        overlayContext.lineWidth = 2;
        overlayContext.strokeStyle = 'red';
        overlayContext.stroke();

        // Extraer la imagen del box y guardarla en base64
        const boxWidth = x2 - x1;
        const boxHeight = y2 - y1;
        const boxCanvas = document.createElement('canvas');
        boxCanvas.width = boxWidth;
        boxCanvas.height = boxHeight;
        const boxContext = boxCanvas.getContext('2d');
        if (boxContext) {
          boxContext.drawImage(this.canvas.nativeElement, x1, y1, boxWidth, boxHeight, 0, 0, boxWidth, boxHeight);
          const boxImageBase64 = boxCanvas.toDataURL('image/png')
          this.detectedBoxesArray.push(boxImageBase64);
        }
      });
    }
  }

  analyzer() {
    this.isProcessing = true;
    this.openAiService.analyzePimientos(this.detectedBoxesArray, this.apiKey).then((response) => {
      const jsonObject: any = this.convertToJson(response.choices[0].message.content!);
      this.isProcessing = false;
      const peppers: Pepper[] = jsonObject['peppers']
      peppers.map((pepper, index) => {
        pepper.valor = this.detectedBoxesArray[index]
      })
      this.peppers.emit(peppers)
      this.summaryObs.emit(jsonObject['summaryObs'])
    })
  }

  convertToJson(content: string): object {
    try {
      const jsonString = content.replace(/^```json\n/, '').replace(/\n```$/, '');
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error al parsear el JSON:", error);
      return {};
    }
  }

  setUrl(url: string) {
    if (url.trim() !== '') {
      this.serverUrl = url;
      this.isUrlSet = true;
    }
  }

  setApiKey(apiKey: string) {
    if (apiKey.trim() !== '') {
      this.apiKey = apiKey;
      this.isApiKeySet = true;
    }
  }
}
