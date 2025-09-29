import { useEffect, useState } from 'react';
import { followUser, unfollowUser, getFollowers } from '../lib/api.js';

export default function FollowButton({ profileId, meId, onChange }) {
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let active = true;
    async function probe() {
      try {
        const data = await getFollowers(profileId, 1);
        const my = meId || JSON.parse(localStorage.getItem('user') || '{}')._id;
        const found = data.items.some(u => String(u._id) === String(my));
        if (active) setFollowing(found);
      } catch {}
    }
    if (profileId) probe();
    return () => { active = false; };
  }, [profileId, meId]);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(profileId);
        setFollowing(false);
        onChange && onChange('unfollow');
      } else {
        await followUser(profileId);
        setFollowing(true);
        onChange && onChange('follow');
      }
    } finally {
      setLoading(false);
    }
  }

  if (String(profileId) === String(meId || (JSON.parse(localStorage.getItem('user') || '{}')._id || ''))) return null;

  return (
    <button onClick={toggle} disabled={loading} className="px-3 py-1 rounded border">
      {loading ? '...' : following ? 'Dejar de seguir' : 'Seguir'}
    </button>
  );
}