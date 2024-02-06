import React from "react";
import { Flex, ScrollArea, Link, Text } from "@radix-ui/themes";
import { GameState } from "../../shared/shared";

interface PreviousSongsProps {
  previousSongs: GameState["previousSongs"];
}

const PreviousSongs: React.FC<PreviousSongsProps> = ({ previousSongs }) => {
  return (
    <Flex direction="column" gap="2">
      <Text size="2" weight="bold">
        Previous songs
      </Text>
      <ScrollArea
        size="1"
        type="hover"
        scrollbars="vertical"
        style={{ maxHeight: 200 }}
      >
        <Flex direction="column" gap="3">
          {previousSongs.map((song) => (
            <Flex direction="column" gap="0">
              <Text size="2">
                <Link href={song.promotionalLink} target="_blank">
                  {song.title}
                </Link>
              </Text>
              <Text size="1" weight="medium">
                {song.artistNames.join(", ")}
              </Text>
            </Flex>
          ))}
        </Flex>
      </ScrollArea>
    </Flex>
  );
};

export default PreviousSongs;
