import BangLogo from "../../Components/BangLogo";
import Button from "../../Components/Button";
import { getLabel, Language, LanguageProvider, useLanguage } from "../../Locale/Registry";
import Env from "../../Model/Env";
import { downloadCsv } from "../../Utils/FileUtils";
import useFetch from "../../Utils/UseFetch";
import { getLocalizedCardName } from "../Game/GameStringComponent";
import "../../App.css";
import "./Style/GameStats.css";

interface PlayerStats {
    bangs_played: number;
    ability_uses: number;
    dynamite_explosions: number;
    prison_turns_skipped: number;
    duels_lost: number;
    kills: number;
}

interface PlayerGameReport {
    user_id: number;
    username: string;
    is_bot: boolean;
    character: string;
    role: string;
    survived: boolean;
    won: boolean;
    stats: PlayerStats;
}

interface GameReport {
    game_id: string;
    lobby_id: number;
    started_at: number;
    ended_at: number;
    num_players: number;
    num_rounds: number;
    expansions: string[];
    players: PlayerGameReport[];
}

function getBaseRole(role: string): string {
    return role.replace(/_3p$/, '');
}

function getLocalizedRole(language: Language, role: string): string {
    const key = 'icon-' + getBaseRole(role);
    return getLabel(language, 'PlayerIcon', key);
}

function sortPlayers(players: PlayerGameReport[]): PlayerGameReport[] {
    return [...players].sort((a, b) => {
        if (a.won !== b.won) return a.won ? -1 : 1;
        if (a.survived !== b.survived) return a.survived ? -1 : 1;
        return b.stats.kills - a.stats.kills;
    });
}

function GameStatsTable({ game }: { game: GameReport }) {
    const language = useLanguage();
    const players = sortPlayers(game.players);

    const yesNo = (value: boolean) => getLabel(language, 'ui', value ? 'BUTTON_YES' : 'BUTTON_NO');

    const handleDownloadCsv = () => {
        const header = [
            getLabel(language, 'GameStats', 'COLUMN_PLAYER'),
            getLabel(language, 'GameStats', 'COLUMN_CHARACTER'),
            getLabel(language, 'GameStats', 'COLUMN_ROLE'),
            getLabel(language, 'GameStats', 'COLUMN_SURVIVED'),
            getLabel(language, 'GameStats', 'COLUMN_WON'),
            getLabel(language, 'GameStats', 'COLUMN_BANGS_PLAYED'),
            getLabel(language, 'GameStats', 'COLUMN_ABILITY_USES'),
            getLabel(language, 'GameStats', 'COLUMN_DYNAMITE_EXPLOSIONS'),
            getLabel(language, 'GameStats', 'COLUMN_PRISON_TURNS'),
            getLabel(language, 'GameStats', 'COLUMN_DUELS_LOST'),
            getLabel(language, 'GameStats', 'COLUMN_KILLS'),
        ];
        const rows = players.map(player => [
            player.username,
            getLocalizedCardName(language, player.character),
            getLocalizedRole(language, player.role),
            yesNo(player.survived),
            yesNo(player.won),
            player.stats.bangs_played.toString(),
            player.stats.ability_uses.toString(),
            player.stats.dynamite_explosions.toString(),
            player.stats.prison_turns_skipped.toString(),
            player.stats.duels_lost.toString(),
            player.stats.kills.toString(),
        ]);
        downloadCsv(`bang_game_${game.game_id}.csv`, [header, ...rows]);
    };

    return <>
        <h1 className="game-stats-title">{getLabel(language, 'GameStats', 'TITLE')}</h1>
        <div className="game-stats-subtitle">{getLabel(language, 'GameStats', 'NUM_ROUNDS')}: {game.num_rounds}</div>
        <div className="overflow-x-auto w-full">
            <table className="game-stats-table min-w-full border-collapse text-center">
                <thead>
                    <tr>
                        <th>{getLabel(language, 'GameStats', 'COLUMN_PLAYER')}</th>
                        <th>{getLabel(language, 'GameStats', 'COLUMN_CHARACTER')}</th>
                        <th>{getLabel(language, 'GameStats', 'COLUMN_ROLE')}</th>
                        <th>{getLabel(language, 'GameStats', 'COLUMN_SURVIVED')}</th>
                        <th>{getLabel(language, 'GameStats', 'COLUMN_WON')}</th>
                        <th>{getLabel(language, 'GameStats', 'COLUMN_BANGS_PLAYED')}</th>
                        <th>{getLabel(language, 'GameStats', 'COLUMN_ABILITY_USES')}</th>
                        <th>{getLabel(language, 'GameStats', 'COLUMN_DYNAMITE_EXPLOSIONS')}</th>
                        <th>{getLabel(language, 'GameStats', 'COLUMN_PRISON_TURNS')}</th>
                        <th>{getLabel(language, 'GameStats', 'COLUMN_DUELS_LOST')}</th>
                        <th>{getLabel(language, 'GameStats', 'COLUMN_KILLS')}</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map(player => (
                        <tr key={player.user_id} className={player.won ? 'game-stats-winner' : ''}>
                            <td className="font-medium">{player.username}</td>
                            <td>{getLocalizedCardName(language, player.character)}</td>
                            <td>{getLocalizedRole(language, player.role)}</td>
                            <td>{yesNo(player.survived)}</td>
                            <td>{yesNo(player.won)}</td>
                            <td>{player.stats.bangs_played}</td>
                            <td>{player.stats.ability_uses}</td>
                            <td>{player.stats.dynamite_explosions}</td>
                            <td>{player.stats.prison_turns_skipped}</td>
                            <td>{player.stats.duels_lost}</td>
                            <td>{player.stats.kills}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="flex justify-center mt-4">
            <Button color='blue' onClick={handleDownloadCsv}>{getLabel(language, 'GameStats', 'BUTTON_DOWNLOAD_CSV')}</Button>
        </div>
    </>;
}

function GameStatsInner() {
    const language = useLanguage();
    const params = new URLSearchParams(window.location.search);
    const lobbyId = params.get('lobby') ?? '';

    const gamesUrl = Env.bangGamesUrl + '?' + new URLSearchParams({ lobby: lobbyId, limit: '1' }).toString();
    const games = useFetch<GameReport[]>(gamesUrl);

    if (!games) {
        return <div className="game-stats-subtitle">{getLabel(language, 'GameStats', 'LOADING')}</div>;
    }
    if (games.length === 0) {
        return <div className="game-stats-subtitle">{getLabel(language, 'GameStats', 'NOT_FOUND')}</div>;
    }
    return <GameStatsTable game={games[0]} />;
}

export default function GameStatsScene() {
    return <LanguageProvider>
        <div className="game-stats-scene">
            <BangLogo />
            <div className="game-stats-panel">
                <GameStatsInner />
            </div>
        </div>
    </LanguageProvider>;
}
