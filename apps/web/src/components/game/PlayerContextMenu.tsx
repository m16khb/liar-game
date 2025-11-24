// 플레이어 컨텍스트 메뉴 컴포넌트
// 우클릭 시 표시되는 방장 위임 메뉴

import { Player, ContextMenuState } from '../../types/game'

interface PlayerContextMenuProps {
  contextMenu: ContextMenuState
  onTransferHost: (player: Player) => void
  onClose: () => void
}

export default function PlayerContextMenu({
  contextMenu,
  onTransferHost,
  onClose
}: PlayerContextMenuProps) {
  if (!contextMenu.visible || !contextMenu.targetPlayer) {
    return null
  }

  const handleClick = () => {
    onTransferHost(contextMenu.targetPlayer!)
    onClose()
  }

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        minWidth: '180px'
      }}
    >
      <button
        onClick={handleClick}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-800 flex items-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <span>👑</span>
        <span>방장 위임</span>
        <span className="ml-auto text-xs text-gray-500">
          {contextMenu.targetPlayer.nickname || `플레이어 ${contextMenu.targetPlayer.userId}`}
        </span>
      </button>
    </div>
  )
}
