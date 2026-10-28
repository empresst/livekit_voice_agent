"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { useTrackVolume, useVoiceAssistant } from "@livekit/components-react";

const OrbScene = dynamic(() => import("./OrbScene"), { ssr: false });

class Boundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Level({
  track,
  levelRef,
}: {
  track: Parameters<typeof useTrackVolume>[0];
  levelRef: MutableRefObject<number>;
}) {
  const volume = useTrackVolume(track);
  useEffect(() => {
    levelRef.current = volume;
  }, [volume, levelRef]);
  return null;
}

function Fallback({ state }: { state: string }) {
  const color =
    state === "speaking"
      ? "bg-green-500"
      : state === "thinking"
      ? "bg-amber-500"
      : state === "listening"
      ? "bg-blue-500"
      : "bg-gray-500";
  return (
    <div className="h-full flex items-center justify-center">
      <div className={`h-28 w-28 rounded-full ${color} transition-colors`} />
    </div>
  );
}

export default function AgentVisual() {
  const { state, audioTrack } = useVoiceAssistant();
  const stateRef = useRef<string>(state);
  const levelRef = useRef(0);
  const [simple, setSimple] = useState(true);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const weak = (navigator.hardwareConcurrency ?? 4) <= 2;
    setSimple(reduce || weak);
  }, []);

  return (
    <div className="w-full">
      <div className="h-64" style={{ touchAction: "pan-y" }}>
        {simple ? (
          <Fallback state={state} />
        ) : (
          <Boundary fallback={<Fallback state={state} />}>
            <OrbScene stateRef={stateRef} levelRef={levelRef} />
          </Boundary>
        )}
      </div>
      <p className="text-center text-sm text-gray-400 capitalize">{state}</p>
      {audioTrack && <Level track={audioTrack} levelRef={levelRef} />}
    </div>
  );
}