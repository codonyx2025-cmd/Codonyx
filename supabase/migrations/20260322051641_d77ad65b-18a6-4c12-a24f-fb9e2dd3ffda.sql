
DROP POLICY IF EXISTS "Users can update received connections" ON public.connections;

CREATE POLICY "Users can update own connections"
ON public.connections
FOR UPDATE
TO public
USING (
  (auth.uid() IN (SELECT profiles.user_id FROM profiles WHERE profiles.id = connections.sender_id))
  OR
  (auth.uid() IN (SELECT profiles.user_id FROM profiles WHERE profiles.id = connections.receiver_id))
);
