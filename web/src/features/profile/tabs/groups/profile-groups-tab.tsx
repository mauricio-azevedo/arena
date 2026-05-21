import { MyGroupsList } from '@/features/groups/components/my-groups-list';
import { getPublicProfileGroups } from '@/features/profile/profile-user.api';

type Props = {
  userId?: string;
};

export function ProfileGroupsTab({ userId }: Props) {
  if (userId) {
    return <MyGroupsList loadGroups={() => getPublicProfileGroups(userId)} ratingLabel="Rating" />;
  }

  return <MyGroupsList />;
}
