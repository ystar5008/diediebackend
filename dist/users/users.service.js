"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const report_entity_1 = require("../reports/entities/report.entity");
const kakaouser_entity_1 = require("./entities/kakaouser.entity");
const typeorm_2 = require("typeorm");
const users_repository_1 = require("./users.repository");
let UsersService = exports.UsersService = class UsersService {
    constructor(usersRepository, authService, kakaoRepository, reportRepository) {
        this.usersRepository = usersRepository;
        this.authService = authService;
        this.kakaoRepository = kakaoRepository;
        this.reportRepository = reportRepository;
        this.check = false;
        this.http = new axios_1.HttpService();
        this.accessToken = '';
    }
    async createUser(createUserdto) {
        try {
            const { email, emailVerified, nicknameVerified } = createUserdto;
            console.log(emailVerified, nicknameVerified);
            if (!emailVerified) {
                throw new common_1.BadRequestException('이메일 인증을 완료해주세요');
            }
            if (!nicknameVerified) {
                throw new common_1.BadRequestException('닉네임 중복 확인을 완료해주세요');
            }
            const userExist = await this.usersRepository.checkUserExists(email);
            if (userExist) {
                throw new common_1.BadRequestException('해당 이메일로는 가입할 수 없습니다.');
            }
            await this.usersRepository.createUser(createUserdto);
            return { msg: '회원가입 성공' };
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }
    async checknickname(nickname) {
        const nickBool = await this.usersRepository.checknickname(nickname);
        if (nickBool) {
            throw new common_1.BadRequestException('중복된 닉네임 입니다.');
        }
        else {
            return { msg: '사용 가능한 닉네임 입니다.' };
        }
    }
    async login(email, password) {
        const user = await this.usersRepository.loginUserExists(email, password);
        if (!user) {
            throw new common_1.NotFoundException('유저가 존재하지 않습니다');
        }
        const accessToken = this.authService.login({
            userId: user.userId,
            email: user.email,
        });
        return { accessToken, user };
    }
    async deleteUser(userId) {
        return await this.usersRepository.deleteUser(userId);
    }
    async putMyInfo(putMyInfoArg) {
        const { userId, reqUserId } = putMyInfoArg;
        const loggedInUser = await this.usersRepository.findOne(reqUserId);
        const wantPutUser = await this.usersRepository.findOne(userId);
        if (loggedInUser.nickname !== wantPutUser.nickname)
            throw common_1.BadRequestException;
        return await this.usersRepository.putMyInfo(putMyInfoArg);
    }
    async getMyReport({ page, pageSize, userId }) {
        const reportData = await this.reportRepository.find({
            select: {
                reportId: true,
                summonerId: true,
                summonerPhoto: true,
                category: true,
                reportPayload: true,
                reportCapture: true,
                reportDate: true,
                createdAt: true,
            },
            where: userId,
            skip: (page - 1) * pageSize,
            take: page * pageSize,
        });
        const myReportCount = reportData.length;
        return { myReportData: { myReportCount, reportData } };
    }
    async kakaoLogin(url, headers) {
        try {
            const data = await this.http.post(url, '', { headers }).toPromise();
            console.log(data.data.refresh_token);
            this.setToken(data.data.access_token);
            const response = await this.http
                .get('https://kapi.kakao.com/v2/user/me', {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            })
                .toPromise();
            const kakaoId = await this.kakaoRepository.findOne({
                where: { email: response.data.kakao_account.email },
            });
            if (!kakaoId) {
                await this.kakaoRepository.save({
                    email: response.data.kakao_account.email,
                    nickname: response.data.properties.nickname,
                    profile_image: response.data.properties.profile_image,
                });
            }
            return this.accessToken;
        }
        catch (error) {
            console.error(error);
        }
    }
    setToken(token) {
        this.accessToken = token;
        return true;
    }
};
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(kakaouser_entity_1.Kakaousers)),
    __param(3, (0, typeorm_1.InjectRepository)(report_entity_1.Reports)),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository,
        auth_service_1.AuthService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map