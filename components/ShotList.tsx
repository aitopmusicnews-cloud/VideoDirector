import type { Shot } from '../types';

export default function ShotList({ shots }: { shots: Shot[] }) {
  return (
    <div className="shot-list">
      {shots.map((shot) => (
        <article className="shot-card" key={`${shot.shotNumber}-${shot.timestamp}`}>
          <div className="shot-heading"><strong>Shot {shot.shotNumber}</strong><span>{shot.timestamp}</span></div>
          <p><b>Location:</b> {shot.location}</p>
          <p><b>Camera:</b> {shot.cameraAngle}</p>
          <p><b>Lighting:</b> {shot.lighting}</p>
          <p><b>Description:</b> {shot.shotDescription}</p>
          <p><b>Lyric sync:</b> {shot.lyricSync || '—'}</p>
          <details><summary>Image prompt</summary><pre>{shot.imagePrompt}</pre></details>
          <details><summary>Video prompt</summary><pre>{shot.videoPrompt}</pre></details>
        </article>
      ))}
    </div>
  );
}
