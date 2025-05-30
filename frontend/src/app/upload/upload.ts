import { Component, ElementRef, input, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api-service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-upload',
  imports: [MatProgressSpinnerModule],
  templateUrl: './upload.html',
  styleUrl: './upload.scss'
})
export class Upload implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  public isUploading: boolean = false;
  public uploadMessage: string = '';

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.isUploadingStatus$.subscribe((isUploading) => {
      this.isUploading = isUploading;
    });
    this.apiService.uploadMessage$.subscribe((resultMessage)=>{
      this.uploadMessage = resultMessage;
      // console.log(resultMessage);  
    });
    // setInterval(() => {
    //   this.uploadMessage = ''; // Reset the string every 10 seconds
    // }, 10000);
  }

  selectedFiles: File[] = [];
  requiredExtensions = ['shp', 'prj'];
  missingFiles: string[] = [];
  canSubmit = false;

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.selectedFiles = Array.from(input.files);

    // Validate that exactly 2 files are selected
    if (this.selectedFiles.length !== 2) {
      this.missingFiles = ['shp', 'prj']; // Default assumption: both are missing
      this.canSubmit = false;
      this.uploadMessage = 'Please provide 1 .shp file and 1 .prj file';
      input.value = '';
      return;
    }

    // Extract file extensions
    const uploadedExtensions = this.selectedFiles.map(file =>
      file.name.split('.').pop()?.toLowerCase()
    );

    // Determine which required files are missing
    this.missingFiles = this.requiredExtensions.filter(ext => !uploadedExtensions.includes(ext));

    // Enable submit only if both required files are present and exactly two files are selected
    this.canSubmit = this.missingFiles.length === 0;

    if (this.selectedFiles.length !== 2 || this.missingFiles.length > 0) {
      input.value = ''; // reset file input
      this.uploadMessage = 'Please provide 1 .shp file and 1 .prj file';
    }
  }


  submit(): void {
    if (!this.canSubmit) {
      alert(this.uploadMessage);
      return;
    }

    const formData = new FormData();
    const shpFile = this.selectedFiles.find(file => file.name.toLowerCase().endsWith('.shp'));
    const prjFile = this.selectedFiles.find(file => file.name.toLowerCase().endsWith('.prj'));

    if (shpFile) formData.append('ShpFile', shpFile, shpFile.name);
    if (prjFile) formData.append('PrjFile', prjFile, prjFile.name);

    this.apiService.postShapefile(formData);
    this.fileInput.nativeElement.value = '';
    this.selectedFiles = [];
    this.canSubmit = false;
  }
}

