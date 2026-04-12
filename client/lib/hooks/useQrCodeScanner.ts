"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

export const TWO_DIMENSIONAL_BARCODE_FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.PDF_417,
  BarcodeFormat.AZTEC,
];

type UseQrCodeScannerOptions = {
  active: boolean;
  onScan: (value: string) => void | Promise<void>;
  delayBetweenScanAttempts?: number;
  delayBetweenScanSuccess?: number;
  formats?: BarcodeFormat[];
};

const getCameraErrorMessage = (error: unknown) => {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name?: string }).name || "")
      : "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera permission was denied. Please allow camera access in your browser.";
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera was found on this device.";
  }

  if (name === "NotReadableError" || name === "TrackStartError") {
    return "The camera is already in use by another app or tab.";
  }

  if (name === "SecurityError" || !window.isSecureContext) {
    return "Camera access needs a secure site. Open this page on HTTPS or localhost.";
  }

  return "Unable to start the QR scanner camera. Use manual entry below.";
};

export const useQrCodeScanner = ({
  active,
  onScan,
  delayBetweenScanAttempts = 150,
  delayBetweenScanSuccess = 1500,
  formats = TWO_DIMENSIONAL_BARCODE_FORMATS,
}: UseQrCodeScannerOptions) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const onScanRef = useRef(onScan);
  const lastScannedRef = useRef<string | null>(null);
  const torchStateRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    readerRef.current = null;
    lastScannedRef.current = null;
    torchStateRef.current = false;
    setTorchOn(false);
  }, []);

  useEffect(() => {
    if (!active) {
      setCameraError(null);
      stopCamera();
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      if (!videoRef.current || typeof navigator === "undefined") {
        return;
      }

      setCameraError(null);
      lastScannedRef.current = null;

      try {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts,
          delayBetweenScanSuccess,
        });
        readerRef.current = reader;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const controls = await reader.decodeFromStream(
          stream,
          videoRef.current,
          (result) => {
            const text = result?.getText()?.trim();
            if (!text || lastScannedRef.current === text) {
              return;
            }

            lastScannedRef.current = text;
            void onScanRef.current(text);

            window.setTimeout(() => {
              if (lastScannedRef.current === text) {
                lastScannedRef.current = null;
              }
            }, delayBetweenScanSuccess);
          },
        );

        if (cancelled) {
          controls.stop();
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        controlsRef.current = controls;
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCameraError(getCameraErrorMessage(error));
        stopCamera();
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [
    active,
    delayBetweenScanAttempts,
    delayBetweenScanSuccess,
    formats,
    stopCamera,
  ]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()?.[0];

    if (!track) {
      throw new Error("Camera is not ready yet.");
    }

    const nextTorchState = !torchStateRef.current;

    try {
      await (track as MediaStreamTrack & {
        applyConstraints: (
          constraints: MediaTrackConstraints & {
            advanced?: Array<Record<string, unknown>>;
          },
        ) => Promise<void>;
      }).applyConstraints({
        advanced: [{ torch: nextTorchState }],
      });

      torchStateRef.current = nextTorchState;
      setTorchOn(nextTorchState);
    } catch {
      throw new Error("Torch not supported on this device.");
    }
  }, []);

  return {
    cameraError,
    stopCamera,
    toggleTorch,
    torchOn,
    videoRef,
  };
};
