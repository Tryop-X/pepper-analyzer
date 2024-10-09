import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {CameraDetectionComponent} from "./components/camera-detection.component";
import {Pepper, PepperAnalysisComponent} from "./components/pepper-analysis.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CameraDetectionComponent, PepperAnalysisComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  summaryObs = '';
  peppers: Pepper[] = [];
}
