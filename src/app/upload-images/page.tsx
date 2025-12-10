'use client';

import { useState, useRef } from 'react';
import { Upload as UploadIcon } from 'lucide-react';

export default function UploadImagesPage() {
  const [mainProductImg, setMainProductImg] = useState<File | null>(null);
  const [dotImgs, setDotImgs] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{
    mainProduct: string;
    dotProducts: Array<{
      imageName: string;
      position: { left: string; top: string } | null;
      rawResponse: string;
    }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMainProductSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setMainProductImg(files[0]);
    }
  };

  const handleDotImgsSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setDotImgs(prev => [...prev, ...fileArray]);
    }
  };

  const removeMainProduct = () => {
    setMainProductImg(null);
  };

  const removeDotImg = (index: number) => {
    setDotImgs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!mainProductImg || dotImgs.length === 0) return;

    setUploading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('mainProductImg', mainProductImg);
      dotImgs.forEach(file => {
        formData.append('dotImg', file);
      });

      const response = await fetch('/api/ai/test', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setResults(data.results || null);
    } catch (error) {
      console.error('Upload error:', error);
      setResults({
        mainProduct: 'Error processing images',
        dotProducts: []
      });
    } finally {
      setUploading(false);
    }
  };

  const clearAll = () => {
    setMainProductImg(null);
    setDotImgs([]);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Image Upload & Analysis</h1>

        {/* Main Product Image Upload Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Object Image</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-2">
            Upload Object Image
          </div>
          <p className="text-gray-600 mb-4">
            Select the object image to be positioned in environments
          </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainProductSelect}
              className="hidden"
              id="main-product-upload"
            />
            <label
              htmlFor="main-product-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Choose Main Product Image
            </label>
          </div>
        </div>

        {/* Dot Images Upload Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Environment Images</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              Upload Environment Images
            </div>
            <p className="text-gray-600 mb-4">
              Select one or more environment images where the object will be positioned
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleDotImgsSelect}
              className="hidden"
              id="dot-images-upload"
            />
            <label
              htmlFor="dot-images-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Choose Dot Images
            </label>
          </div>
        </div>

        {/* Main Product Image Display */}
        {mainProductImg && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Main Product Image</h3>
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-md">
              <div className="flex items-center space-x-3">
                <img
                  src={URL.createObjectURL(mainProductImg)}
                  alt={mainProductImg.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="font-medium text-sm">{mainProductImg.name}</p>
                  <p className="text-xs text-gray-500">
                    {(mainProductImg.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-blue-600 font-medium">Object</p>
                </div>
              </div>
              <button
                onClick={removeMainProduct}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Dot Images List */}
        {dotImgs.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Dot Product Images ({dotImgs.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {dotImgs.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-md">
                  <div className="flex items-center space-x-3">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDotImg(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={handleSubmit}
            disabled={!mainProductImg || dotImgs.length === 0 || uploading}
            className="btn btn-primary flex-1"
          >
            {uploading ? 'Processing...' : `Position Object in ${dotImgs.length} Environment${dotImgs.length !== 1 ? 's' : ''}`}
          </button>
          <button
            onClick={clearAll}
            disabled={uploading}
            className="btn btn-outline"
          >
            Clear All
          </button>
        </div>

        {/* Results Section */}
        {results && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Object Positioning Results</h3>
            <div className="space-y-6">
              {/* Object Info */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">Object Image</h4>
                <p className="text-gray-700">{results.mainProduct}</p>
                <p className="text-xs text-blue-600 mt-1">This object will be positioned in each environment</p>
              </div>

              {/* Environment Results */}
              <div>
                <h4 className="font-medium mb-3 text-green-800">Position in Environments ({results.dotProducts.length})</h4>
                <div className="space-y-3">
                  {results.dotProducts.map((result, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <h5 className="font-medium mb-2 text-green-700">Environment {index + 1}: {result.imageName}</h5>

                      {result.position ? (
                        <div className="mb-3">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="bg-white p-3 rounded border">
                              <div className="text-sm text-gray-600">Left Position</div>
                              <div className="text-lg font-bold text-green-600">{result.position.left}</div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-sm text-gray-600">Top Position</div>
                              <div className="text-lg font-bold text-green-600">{result.position.top}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            Position of object center relative to environment image dimensions
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="text-sm text-yellow-800">⚠️ Position data not found in response</div>
                        </div>
                      )}

                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          View Raw AI Response
                        </summary>
                        <div className="mt-2 p-3 bg-white border rounded text-sm text-gray-700 whitespace-pre-wrap">
                          {result.rawResponse}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
